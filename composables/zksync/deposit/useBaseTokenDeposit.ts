import { readContract, writeContract } from "@wagmi/core";
import { type Address, type Hash, erc20Abi } from "viem";
import { REQUIRED_L1_TO_L2_GAS_PER_PUBDATA_LIMIT } from "zksync-ethers/build/utils";

import { BRIDGEHUB_ABI } from "@/data/abis/bridgehubAbi";
import { wagmiConfig } from "@/data/wagmi";

import type { DepositFeeValues } from "@/composables/zksync/deposit/useFee";
import type { BigNumberish } from "ethers";

export const useBaseTokenDeposit = () => {
  const networkStore = useNetworkStore();
  const { selectedNetwork } = storeToRefs(networkStore);

  /**
   * Check if current network is a Base Token chain
   */
  const isBaseTokenChain = computed(() => {
    return !!selectedNetwork.value.baseToken && !!selectedNetwork.value.bridgeContracts?.bridgehub;
  });

  /**
   * Get Base Token info for current network
   */
  const baseTokenInfo = computed(() => {
    if (!isBaseTokenChain.value) return null;
    return selectedNetwork.value.baseToken!;
  });

  /**
   * Get Bridgehub contract address
   */
  const bridgehubAddress = computed(() => {
    if (!isBaseTokenChain.value) return null;
    return selectedNetwork.value.bridgeContracts!.bridgehub as Address;
  });

  /**
   * Check Base Token allowance for Bridgehub
   */
  const checkAllowance = async (userAddress: Address): Promise<bigint> => {
    if (!isBaseTokenChain.value || !baseTokenInfo.value) {
      throw new Error("Not a Base Token chain");
    }

    const allowance = await readContract(wagmiConfig, {
      address: baseTokenInfo.value.l1Address as Address,
      abi: erc20Abi,
      functionName: "allowance",
      args: [userAddress, bridgehubAddress.value!],
    });

    return allowance;
  };

  /**
   * Approve Base Token for Bridgehub
   */
  const approveBaseToken = async (amount: BigNumberish): Promise<Hash> => {
    if (!isBaseTokenChain.value || !baseTokenInfo.value) {
      throw new Error("Not a Base Token chain");
    }

    const hash = await writeContract(wagmiConfig, {
      address: baseTokenInfo.value.l1Address as Address,
      abi: erc20Abi,
      functionName: "approve",
      args: [bridgehubAddress.value!, BigInt(amount.toString())],
    });

    return hash;
  };

  /**
   * Deposit Base Token to L2 via Bridgehub
   */
  const depositBaseToken = async (
    transaction: {
      to: Address;
      amount: BigNumberish;
      l2GasLimit?: bigint;
      gasPerPubdata?: bigint;
      refundRecipient?: Address;
    },
    fee: DepositFeeValues
  ): Promise<{ hash: Hash; from: Address; to: Address }> => {
    if (!isBaseTokenChain.value || !baseTokenInfo.value) {
      throw new Error("Not a Base Token chain");
    }

    const onboardStore = useOnboardStore();
    const userAddress = onboardStore.account.address;
    if (!userAddress) throw new Error("User address not available");

    const gasPerPubdata = transaction.gasPerPubdata ?? BigInt(REQUIRED_L1_TO_L2_GAS_PER_PUBDATA_LIMIT);
    const l2GasLimit = transaction.l2GasLimit ?? 1000000n;

    // Prepare transaction request
    const request = {
      chainId: BigInt(selectedNetwork.value.id),
      mintValue: BigInt(transaction.amount.toString()), // Amount of Base Token to mint on L2
      l2Contract: transaction.to,
      l2Value: 0n, // Not used for Base Token
      l2Calldata: "0x" as `0x${string}`,
      l2GasLimit,
      l2GasPerPubdataByteLimit: gasPerPubdata,
      factoryDeps: [] as `0x${string}`[],
      refundRecipient: transaction.refundRecipient || transaction.to,
    };

    // For Base Token chains, msg.value must be 0
    // All fees (L1 and L2) are paid in Base Token (tMai)
    const hash = await writeContract(wagmiConfig, {
      address: bridgehubAddress.value!,
      abi: BRIDGEHUB_ABI,
      functionName: "requestL2TransactionDirect",
      args: [request],
      value: 0n, // No BNB needed - all fees paid in tMai
      gasPrice: fee.gasPrice,
      gas: fee.l1GasLimit,
    });

    return {
      hash,
      from: userAddress as Address,
      to: transaction.to,
    };
  };

  return {
    isBaseTokenChain,
    baseTokenInfo,
    bridgehubAddress,
    checkAllowance,
    approveBaseToken,
    depositBaseToken,
  };
};
