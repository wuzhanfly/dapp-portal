import { readContract, writeContract, estimateGas } from "@wagmi/core";
import { type Address, type Hash, zeroAddress, encodeFunctionData } from "viem";
import { REQUIRED_L1_TO_L2_GAS_PER_PUBDATA_LIMIT } from "zksync-ethers/build/utils";

import { BRIDGEHUB_ABI } from "@/data/abis/bridgehubAbi";
import { ERC20_BRIDGE_ABI } from "@/data/abis/erc20BridgeAbi";
import { WBNB_ABI } from "@/data/abis/wbnbAbi";
import { wagmiConfig } from "@/data/wagmi";
import { generateSecondBridgeCalldata } from "@/utils/bridgeEncoding";

import type { DepositFeeValues } from "@/composables/zksync/deposit/useFee";
import type { BigNumberish } from "ethers";

// WBNB address on BSC Testnet
export const WBNB_ADDRESS = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";

export type WBNBDepositStep = "wrap" | "approve" | "deposit" | "done";

export const useWBNBDeposit = () => {
  const onboardStore = useOnboardStore();
  const networkStore = useNetworkStore();
  const { selectedNetwork } = storeToRefs(networkStore);

  const currentStep = ref<WBNBDepositStep | null>(null);
  const wrapTxHash = ref<Hash | undefined>();
  const approveTxHash = ref<Hash | undefined>();
  const depositTxHash = ref<Hash | undefined>();

  // Check if current network supports WBNB deposit
  const isWBNBSupported = computed(() => {
    return (
      selectedNetwork.value.l1Network?.id === 97 && // BSC Testnet
      (!!selectedNetwork.value.bridgeContracts?.bridgehub ||
        !!selectedNetwork.value.bridgeContracts?.sharedBridge ||
        !!selectedNetwork.value.bridgeContracts?.erc20Bridge)
    );
  });

  // Check if this is a Base Token chain
  const isBaseTokenChain = computed(() => {
    return !!selectedNetwork.value.baseToken;
  });

  // Get Bridgehub address (for Base Token chains)
  const bridgehubAddress = computed(() => {
    return selectedNetwork.value.bridgeContracts?.bridgehub as Address | undefined;
  });

  // Get SharedBridge address (for approvals on Base Token chains)
  const sharedBridgeAddress = computed(() => {
    return selectedNetwork.value.bridgeContracts?.sharedBridge as Address | undefined;
  });

  // Get NativeTokenVault address (for ERC20 token approvals)
  const nativeTokenVaultAddress = computed(() => {
    return selectedNetwork.value.bridgeContracts?.nativeTokenVault as Address | undefined;
  });

  // Get ERC20Bridge address (fallback for non-Base Token chains)
  const erc20BridgeAddress = computed(() => {
    return selectedNetwork.value.bridgeContracts?.erc20Bridge as Address | undefined;
  });

  /**
   * Step 1: Wrap BNB to WBNB
   */
  const wrapBNB = async (amount: BigNumberish): Promise<Hash> => {
    if (!isWBNBSupported.value) {
      throw new Error("WBNB deposit not supported on this network");
    }

    currentStep.value = "wrap";

    const hash = await writeContract(wagmiConfig, {
      address: WBNB_ADDRESS,
      abi: WBNB_ABI,
      functionName: "deposit",
      value: BigInt(amount.toString()),
    });

    wrapTxHash.value = hash;
    return hash;
  };

  /**
   * Check WBNB allowance for Bridge
   * For Base Token chains, we need to check NativeTokenVault allowance
   */
  const checkWBNBAllowance = async (userAddress: Address): Promise<bigint> => {
    // For Base Token chains, check NativeTokenVault (SharedBridge will call it)
    // For ETH-based chains, check ERC20Bridge
    const approvalTarget = isBaseTokenChain.value && nativeTokenVaultAddress.value 
      ? nativeTokenVaultAddress.value 
      : erc20BridgeAddress.value;

    if (!approvalTarget) {
      throw new Error("Bridge address not configured");
    }

    const allowance = await readContract(wagmiConfig, {
      address: WBNB_ADDRESS,
      abi: WBNB_ABI,
      functionName: "allowance",
      args: [userAddress, approvalTarget],
    });

    return allowance as bigint;
  };

  /**
   * Step 2: Approve WBNB for Bridge
   * For Base Token chains, approve to NativeTokenVault (SharedBridge will call it)
   */
  const approveWBNB = async (amount: BigNumberish): Promise<Hash> => {
    // For Base Token chains, approve to NativeTokenVault (SharedBridge will call it)
    // For ETH-based chains, approve to ERC20Bridge
    const approvalTarget = isBaseTokenChain.value && nativeTokenVaultAddress.value
      ? nativeTokenVaultAddress.value
      : erc20BridgeAddress.value;

    if (!approvalTarget) {
      throw new Error("Bridge address not configured");
    }

    currentStep.value = "approve";

    const hash = await writeContract(wagmiConfig, {
      address: WBNB_ADDRESS,
      abi: WBNB_ABI,
      functionName: "approve",
      args: [approvalTarget, BigInt(amount.toString())],
    });

    approveTxHash.value = hash;
    return hash;
  };

  /**
   * Step 3: Deposit WBNB via Bridge
   * Note: Approval should be handled before calling this function
   */
  const depositWBNB = async (
    params: {
      to: Address;
      amount: BigNumberish;
      l2GasLimit?: bigint;
      gasPerPubdata?: bigint;
      refundRecipient?: Address;
    },
    fee: DepositFeeValues
  ): Promise<{ hash: Hash; from: string; to: string }> => {
    const userAddress = onboardStore.account.address;
    if (!userAddress) {
      throw new Error("User address not available");
    }

    currentStep.value = "deposit";

    const l2GasLimit = fee.l2GasLimit ?? params.l2GasLimit ?? 550000n; // Use fee's l2GasLimit first
    const gasPerPubdata = params.gasPerPubdata ?? BigInt(REQUIRED_L1_TO_L2_GAS_PER_PUBDATA_LIMIT);
    const refundRecipient = params.refundRecipient ?? params.to;

    let hash: Hash;

    // Base Token chains use Bridgehub with requestL2TransactionTwoBridges
    if (isBaseTokenChain.value && bridgehubAddress.value && sharedBridgeAddress.value) {
      console.log("使用 Bridgehub 进行跨链:", {
        bridgehub: bridgehubAddress.value,
        sharedBridge: sharedBridgeAddress.value,
        wbnb: WBNB_ADDRESS,
        amount: params.amount.toString(),
      });

      // Get L1 chain ID
      const l1ChainId = BigInt(selectedNetwork.value.l1Network?.id || 97);

      // Generate second bridge calldata for ERC20 token deposit
      const secondBridgeCalldata = generateSecondBridgeCalldata(
        l1ChainId,
        WBNB_ADDRESS,
        BigInt(params.amount.toString()),
        params.to
      );

      // Calculate baseCost from Bridgehub
      const gasPrice = fee.gasPrice ?? 3000000000n; // 3 gwei default
      
      // Call Bridgehub to get the actual base cost
      const baseCostResult = await readContract(wagmiConfig, {
        address: bridgehubAddress.value,
        abi: BRIDGEHUB_ABI,
        functionName: "l2TransactionBaseCost",
        args: [BigInt(selectedNetwork.value.id), gasPrice, l2GasLimit, gasPerPubdata],
      });

      const baseCost = BigInt(baseCostResult.toString());

      // Add operator tip and buffer (15% of baseCost to be safe)
      const operatorTip = (baseCost * 15n) / 100n;
      const mintValue = baseCost + operatorTip;

      // Prepare the request for Bridgehub
      const request = {
        chainId: BigInt(selectedNetwork.value.id),
        mintValue, // Base token needed for L2 execution
        l2Value: 0n, // No ETH value
        l2GasLimit,
        l2GasPerPubdataByteLimit: gasPerPubdata,
        refundRecipient: refundRecipient === params.to ? zeroAddress : refundRecipient, // SDK uses zero address
        secondBridgeAddress: sharedBridgeAddress.value, // SharedBridge handles the ERC20 transfer
        secondBridgeValue: 0n,
        secondBridgeCalldata,
      };

      // Manually estimate gas to avoid viem's uint64 max issue
      let estimatedGas: bigint;
      try {
        estimatedGas = await estimateGas(wagmiConfig, {
          to: bridgehubAddress.value,
          data: encodeFunctionData({
            abi: BRIDGEHUB_ABI,
            functionName: "requestL2TransactionTwoBridges",
            args: [request],
          }),
          account: userAddress as Address,
          value: 0n,
          gasPrice: fee.gasPrice,
        });
        // Add 30% buffer
        estimatedGas = (estimatedGas * 130n) / 100n;
      } catch (error) {
        // Fallback to fee.l1GasLimit if estimation fails
        console.warn("Gas estimation failed, using fallback:", error);
        estimatedGas = fee.l1GasLimit;
      }

      try {
        hash = await writeContract(wagmiConfig, {
          address: bridgehubAddress.value,
          abi: BRIDGEHUB_ABI,
          functionName: "requestL2TransactionTwoBridges",
          args: [request],
          value: 0n, // No BNB needed - all fees paid in Base Token (tMai)
          gasPrice: fee.gasPrice,
          gas: estimatedGas, // Use manually estimated gas
        });
      } catch (error: any) {
        // Log the full error for debugging
        console.error("WBNB deposit error:", error);
        console.error("Error message:", error.message);
        
        // Provide helpful error messages
        const errorMsg = error.message?.toLowerCase() || "";
        if (errorMsg.includes("allowance") || errorMsg.includes("erc20: insufficient allowance")) {
          throw new Error("WBNB 授权不足。请确保已授权 WBNB 到 SharedBridge。如果刚刚授权，请等待几秒后重试。");
        }
        if (errorMsg.includes("insufficient funds") || errorMsg.includes("balance")) {
          throw new Error("tMai 余额不足，无法支付交易手续费。");
        }
        if (errorMsg.includes("user rejected") || errorMsg.includes("user denied")) {
          throw new Error("用户取消了交易。");
        }
        // Re-throw original error if we can't identify it
        throw error;
      }
    } else if (erc20BridgeAddress.value) {
      // ETH-based chains use ERC20Bridge with deposit
      const msgValue = fee.baseCost ?? 0n;

      hash = await writeContract(wagmiConfig, {
        address: erc20BridgeAddress.value,
        abi: ERC20_BRIDGE_ABI,
        functionName: "deposit",
        args: [params.to, WBNB_ADDRESS, BigInt(params.amount.toString()), l2GasLimit, gasPerPubdata, refundRecipient],
        value: msgValue,
        gasPrice: fee.gasPrice,
        gas: fee.l1GasLimit,
      });
    } else {
      throw new Error("No bridge address configured");
    }

    depositTxHash.value = hash;
    currentStep.value = "done";

    return {
      hash,
      from: userAddress,
      to: params.to,
    };
  };

  /**
   * Get WBNB balance
   */
  const getWBNBBalance = async (userAddress: Address): Promise<bigint> => {
    const balance = await readContract(wagmiConfig, {
      address: WBNB_ADDRESS,
      abi: WBNB_ABI,
      functionName: "balanceOf",
      args: [userAddress],
    });

    return balance as bigint;
  };

  /**
   * Get L2 WBNB address
   */
  const getL2WBNBAddress = async (): Promise<Address> => {
    const bridgeAddr = isBaseTokenChain.value ? sharedBridgeAddress.value : erc20BridgeAddress.value;

    if (!bridgeAddr) {
      throw new Error("Bridge address not configured");
    }

    const l2Address = await readContract(wagmiConfig, {
      address: bridgeAddr,
      abi: ERC20_BRIDGE_ABI,
      functionName: "l2TokenAddress",
      args: [WBNB_ADDRESS],
    });

    return l2Address as Address;
  };

  /**
   * Reset deposit state
   */
  const reset = () => {
    currentStep.value = null;
    wrapTxHash.value = undefined;
    approveTxHash.value = undefined;
    depositTxHash.value = undefined;
  };

  return {
    // State
    isWBNBSupported,
    isBaseTokenChain,
    currentStep,
    wrapTxHash,
    approveTxHash,
    depositTxHash,
    bridgehubAddress,
    sharedBridgeAddress,
    nativeTokenVaultAddress,
    erc20BridgeAddress,

    // Methods
    wrapBNB,
    checkWBNBAllowance,
    approveWBNB,
    depositWBNB,
    getWBNBBalance,
    getL2WBNBAddress,
    reset,
  };
};
