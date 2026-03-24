import { readContract, writeContract } from "@wagmi/core";
import { zeroAddress, type Address, type Hash } from "viem";
import { L1Signer, utils } from "zksync-ethers";
import { ethers } from "ethers";
import { getERC20DefaultBridgeData, REQUIRED_L1_TO_L2_GAS_PER_PUBDATA_LIMIT } from "zksync-ethers/build/utils";

import { useSentryLogger } from "@/composables/useSentryLogger";
import { useBaseTokenDeposit } from "@/composables/zksync/deposit/useBaseTokenDeposit";
import { useWBNBDeposit, WBNB_ADDRESS } from "@/composables/zksync/deposit/useWBNBDeposit";
import { L1_BRIDGE_ABI } from "@/data/abis/l1BridgeAbi";
import { WBNB_ABI } from "@/data/abis/wbnbAbi";
import { wagmiConfig } from "@/data/wagmi";

import type { DepositFeeValues } from "@/composables/zksync/deposit/useFee";
import type { BigNumberish } from "ethers";

export default (getL1Signer: () => Promise<L1Signer | undefined>) => {
  const status = ref<"not-started" | "processing" | "waiting-for-signature" | "done">("not-started");
  const error = ref<Error | undefined>();
  const ethTransactionHash = ref<Hash | undefined>();
  const eraWalletStore = useZkSyncWalletStore();
  const { captureException } = useSentryLogger();
  const { isBaseTokenChain, baseTokenInfo, approveBaseToken, depositBaseToken, checkAllowance } = useBaseTokenDeposit();
  const {
    isWBNBSupported,
    currentStep: wbnbStep,
    wrapBNB,
    checkWBNBAllowance,
    approveWBNB,
    depositWBNB,
    wrapTxHash,
    approveTxHash,
    depositTxHash,
    sharedBridgeAddress,
  } = useWBNBDeposit();

  const { validateAddress } = useScreening();

  const handleCustomBridgeDeposit = async (
    transaction: {
      to: Address;
      tokenAddress: Address;
      amount: BigNumberish;
      bridgeAddress: Address;
      gasPerPubdata?: bigint;
      l2GasLimit?: bigint;
      refundRecipient?: Address;
    },
    fee: DepositFeeValues
  ) => {
    const l1Signer = await getL1Signer();
    if (!l1Signer) throw new Error("L1 signer is not available");

    const l2BridgeAddress = await readContract(wagmiConfig, {
      address: transaction.bridgeAddress as Address,
      abi: L1_BRIDGE_ABI,
      functionName: "l2Bridge",
    });
    const bridgeData = await getERC20DefaultBridgeData(transaction.tokenAddress, l1Signer.provider);

    const gasPerPubdata = transaction.gasPerPubdata ?? BigInt(REQUIRED_L1_TO_L2_GAS_PER_PUBDATA_LIMIT);
    const l2Value = 0n; // L2 value is not used in this context
    const l2GasLimit = await l1Signer.providerL2.estimateCustomBridgeDepositL2Gas(
      transaction.bridgeAddress,
      l2BridgeAddress,
      transaction.tokenAddress,
      transaction.amount.toString(),
      transaction.to,
      bridgeData,
      l1Signer.address,
      gasPerPubdata,
      l2Value
    );

    const baseCost = await l1Signer.getBaseCost({
      gasLimit: l2GasLimit,
      gasPerPubdataByte: gasPerPubdata,
    });

    // Force legacy transaction type for BSC network compatibility
    const overrides = {
      type: 0, // Force legacy transaction type (non-EIP-1559)
      gasPrice: fee.gasPrice,
      gasLimit: fee.l1GasLimit,
      maxFeePerGas: undefined, // Not used in legacy transactions
      maxPriorityFeePerGas: undefined, // Not used in legacy transactions
    };

    const hash = await writeContract(wagmiConfig, {
      address: transaction.bridgeAddress as Address,
      abi: L1_BRIDGE_ABI,
      functionName: "deposit",
      args: [
        transaction.to,
        transaction.tokenAddress,
        BigInt(transaction.amount.toString()),
        transaction.l2GasLimit ?? 400000n,
        gasPerPubdata,
        transaction.refundRecipient ?? zeroAddress,
      ],
      value: baseCost + (overrides.maxPriorityFeePerGas ? BigInt(overrides.maxPriorityFeePerGas) : 0n),
    });

    return {
      from: l1Signer.address,
      to: transaction.to,
      hash,
      // eslint-disable-next-line require-await
      wait: async () => ({
        from: l1Signer.address,
        to: transaction.to,
        hash,
      }),
    };
  };

  const commitTransaction = async (
    transaction: {
      to: Address;
      tokenAddress: Address;
      amount: BigNumberish;
      bridgeAddress?: Address;
    },
    fee: DepositFeeValues
  ) => {
    try {
      error.value = undefined;

      status.value = "processing";
      const wallet = await getL1Signer();
      if (!wallet) throw new Error("Wallet is not available");

      await eraWalletStore.walletAddressValidate();
      await validateAddress(transaction.to);

      const onboardStore = useOnboardStore();
      const userAddress = onboardStore.account.address;
      if (!userAddress) throw new Error("User address not available");
      const publicClient = onboardStore.getPublicClient();

      // Check if depositing BNB (need to wrap to WBNB first)
      const isBNBDeposit =
        isWBNBSupported.value &&
        (transaction.tokenAddress === utils.ETH_ADDRESS ||
          transaction.tokenAddress.toLowerCase() === "bnb" ||
          transaction.tokenAddress === WBNB_ADDRESS);

      if (isBNBDeposit) {
        // WBNB deposit flow
        const l1Signer = await getL1Signer();
        if (!l1Signer) throw new Error("L1 signer is not available");

        // Step 1: Wrap BNB to WBNB (if not already WBNB)
        if (transaction.tokenAddress !== WBNB_ADDRESS) {
          status.value = "waiting-for-signature";
          const wrapHash = await wrapBNB(transaction.amount);

          status.value = "processing";
          await publicClient.waitForTransactionReceipt({ hash: wrapHash });
        }

        // Step 2: Check and approve WBNB to SharedBridge
        const requiredAmount = BigInt(transaction.amount.toString());
        
        // Get SharedBridge address from SDK
        const bridgeAddresses = await l1Signer.providerL2.getDefaultBridgeAddresses();
        const sharedBridge = bridgeAddresses.sharedL1 as Address;
        
        console.log("检查 WBNB 授权:", {
          wbnb: WBNB_ADDRESS,
          sharedBridge,
          amount: requiredAmount.toString(),
        });
        
        const currentAllowance = await readContract(wagmiConfig, {
          address: WBNB_ADDRESS,
          abi: WBNB_ABI,
          functionName: "allowance",
          args: [userAddress as Address, sharedBridge],
        }) as bigint;

        console.log("当前授权:", ethers.formatEther(currentAllowance.toString()), "WBNB");
        console.log("需要授权:", ethers.formatEther(requiredAmount.toString()), "WBNB");

        // Check if we need to re-approve
        if (currentAllowance < requiredAmount) {
          status.value = "waiting-for-signature";
          console.log("授权不足，正在授权到最大值...");
          
          const maxAmount = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
          const approveHash = await writeContract(wagmiConfig, {
            address: WBNB_ADDRESS,
            abi: WBNB_ABI,
            functionName: "approve",
            args: [sharedBridge, maxAmount],
            gasPrice: fee.gasPrice,
          });

          status.value = "processing";
          console.log("等待授权确认:", approveHash);
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
          
          // Wait for approval to propagate
          await new Promise((resolve) => setTimeout(resolve, 10000));
          console.log("✓ WBNB 授权完成");
        } else {
          console.log("✓ WBNB 授权充足，跳过授权");
        }

        // Step 3: Use SDK deposit
        status.value = "waiting-for-signature";
        console.log("调用 SDK deposit...");
        
        const depositResponse = await l1Signer.deposit({
          token: WBNB_ADDRESS,
          amount: transaction.amount,
          to: transaction.to,
          approveERC20: false, // Already approved manually
          approveBaseERC20: true, // Let SDK handle base token approval
          overrides: {
            type: 0,
            gasPrice: fee.gasPrice,
          },
        });

        console.log("✓ 跨链交易已发送:", depositResponse.hash);
        ethTransactionHash.value = depositResponse.hash as Hash;
        status.value = "done";
        
        return {
          from: l1Signer.address,
          to: transaction.to,
          hash: depositResponse.hash as Hash,
          // eslint-disable-next-line require-await
          wait: async () => ({
            from: l1Signer.address,
            to: transaction.to,
            hash: depositResponse.hash as Hash,
          }),
        };
      }

      // Check if this is a Base Token chain
      if (isBaseTokenChain.value && baseTokenInfo.value) {
        // Base Token deposit flow
        // Check if we need to approve
        const currentAllowance = await checkAllowance(userAddress as Address);
        const requiredAmount = BigInt(transaction.amount.toString());

        if (currentAllowance < requiredAmount) {
          // Step 1: Approve Base Token with max amount
          status.value = "waiting-for-signature";
          const maxAmount = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
          const approveHash = await approveBaseToken(maxAmount);

          // Wait for approval transaction
          status.value = "processing";
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
          
          // Wait longer for the approval to be confirmed and propagated
          await new Promise((resolve) => setTimeout(resolve, 6000));
          
          // Verify approval was successful
          const newAllowance = await checkAllowance(userAddress as Address);
          if (newAllowance < requiredAmount) {
            throw new Error("Base token approval failed. Please try again.");
          }
        }

        // Step 2: Deposit via Bridgehub
        status.value = "waiting-for-signature";
        const depositResponse = await depositBaseToken(
          {
            to: transaction.to,
            amount: transaction.amount,
          },
          fee
        );

        ethTransactionHash.value = depositResponse.hash;
        status.value = "done";
        return {
          ...depositResponse,
          // eslint-disable-next-line require-await
          wait: async () => depositResponse,
        };
      }

      // Standard ETH chain deposit flow
      // Force legacy transaction type for BSC network compatibility
      const overrides = {
        type: 0, // Force legacy transaction type (non-EIP-1559)
        gasPrice: fee.gasPrice,
        gasLimit: fee.l1GasLimit,
        maxFeePerGas: undefined, // Not used in legacy transactions
        maxPriorityFeePerGas: undefined, // Not used in legacy transactions
      };

      status.value = "waiting-for-signature";

      if (transaction.bridgeAddress) {
        const depositResponse = await handleCustomBridgeDeposit(
          { ...transaction, bridgeAddress: transaction.bridgeAddress },
          fee
        );
        ethTransactionHash.value = depositResponse.hash;
        status.value = "done";
        return depositResponse;
      } else {
        const depositResponse = await wallet.deposit({
          to: transaction.to,
          token: transaction.tokenAddress,
          amount: transaction.amount,
          l2GasLimit: fee.l2GasLimit,
          approveBaseERC20: true,
          overrides,
        });

        ethTransactionHash.value = depositResponse.hash as Hash;
        status.value = "done";
        return depositResponse;
      }
    } catch (err) {
      error.value = formatError(err as Error);
      status.value = "not-started";
      captureException({
        error: err as Error,
        parentFunctionName: "commitTransaction",
        parentFunctionParams: [transaction, fee],
        filePath: "composables/zksync/deposit/useTransaction.ts",
      });
    }
  };

  return {
    status,
    error,
    ethTransactionHash,
    commitTransaction,
    // WBNB deposit state
    wbnbStep,
    wrapTxHash,
    approveTxHash,
    depositTxHash,
    isWBNBSupported,
  };
};
