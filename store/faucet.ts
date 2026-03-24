import { readContract, writeContract } from "@wagmi/core";
import { type Address } from "viem";

import { useSentryLogger } from "@/composables/useSentryLogger";
import FaucetABI from "@/contract/AdvancedERC20FaucetABI.json";
import { wagmiConfig } from "@/data/wagmi";

import type { Token } from "@/types";

// Faucet 合约地址 (BSC Testnet)
export const FAUCET_CONTRACT_ADDRESS = "0x04e6A44ECea4eeD011e1378E7fc5eBaCba0F8449" as Address;

// Faucet 用户信息
export type FaucetUserInfo = {
  lastClaimTime: bigint;
  totalClaims: bigint;
  totalAmount: bigint;
  nextAvailableClaim: bigint;
  isEligible: boolean;
};

// Faucet 统计信息
export type FaucetStats = {
  distributed: bigint;
  claimers: bigint;
  faucetBalance: bigint;
  perClaimAmount: bigint;
};

export const useFaucetStore = defineStore("faucet", () => {
  const onboardStore = useOnboardStore();
  const { account, isConnected } = storeToRefs(onboardStore);
  const { captureException } = useSentryLogger();
  const tokensStore = useZkSyncTokensStore();

  // ==================== 查询 Faucet 信息 ====================

  const {
    result: faucetStats,
    inProgress: statsLoading,
    error: statsError,
    execute: requestFaucetStats,
  } = usePromise<FaucetStats>(
    async () => {
      const result = await readContract(wagmiConfig, {
        address: FAUCET_CONTRACT_ADDRESS,
        abi: FaucetABI,
        functionName: "getStats",
      });

      return {
        distributed: result[0] as bigint,
        claimers: result[1] as bigint,
        faucetBalance: result[2] as bigint,
        perClaimAmount: result[3] as bigint,
      };
    },
    { cache: 30000 } // 缓存 30 秒
  );

  const {
    result: userClaimInfo,
    inProgress: userInfoLoading,
    error: userInfoError,
    execute: requestUserClaimInfo,
    reset: resetUserClaimInfo,
  } = usePromise<FaucetUserInfo>(
    async () => {
      if (!account.value.address) throw new Error("Wallet not connected");

      const result = await readContract(wagmiConfig, {
        address: FAUCET_CONTRACT_ADDRESS,
        abi: FaucetABI,
        functionName: "getUserClaimInfo",
        args: [account.value.address as Address],
      });

      return {
        lastClaimTime: result[0] as bigint,
        totalClaims: result[1] as bigint,
        totalAmount: result[2] as bigint,
        nextAvailableClaim: result[3] as bigint,
        isEligible: result[4] as boolean,
      };
    },
    { cache: 10000 } // 缓存 10 秒
  );

  const {
    result: canClaim,
    inProgress: canClaimLoading,
    error: canClaimError,
    execute: checkCanClaim,
  } = usePromise<{ canClaim: boolean; timeRemaining: bigint }>(
    async () => {
      if (!account.value.address) throw new Error("Wallet not connected");

      const result = await readContract(wagmiConfig, {
        address: FAUCET_CONTRACT_ADDRESS,
        abi: FaucetABI,
        functionName: "canUserClaim",
        args: [account.value.address as Address],
      });

      return {
        canClaim: result[0] as boolean,
        timeRemaining: result[1] as bigint,
      };
    },
    { cache: 5000 } // 缓存 5 秒
  );

  // 获取 Faucet 代币信息
  const {
    result: faucetToken,
    inProgress: tokenLoading,
    error: tokenError,
    execute: requestFaucetToken,
  } = usePromise<Token | undefined>(async () => {
    const tokenAddress = await readContract(wagmiConfig, {
      address: FAUCET_CONTRACT_ADDRESS,
      abi: FaucetABI,
      functionName: "tokenContract",
    });

    // 从 tokens store 中查找对应的代币信息
    await tokensStore.requestTokens();
    const { l1Tokens } = storeToRefs(tokensStore);

    return Object.values(l1Tokens.value ?? {}).find(
      (token) => token.address.toLowerCase() === (tokenAddress as string).toLowerCase()
    );
  });

  // ==================== 领取代币 ====================

  const claimStatus = ref<"not-started" | "processing" | "waiting-for-signature" | "sending" | "done">("not-started");
  const claimError = ref<Error | undefined>();
  const claimTransactionHash = ref<string | undefined>();

  const claimTokens = async () => {
    try {
      claimError.value = undefined;
      claimStatus.value = "processing";

      if (!isConnected.value) {
        throw new Error("Please connect your wallet first");
      }

      if (!onboardStore.isCorrectNetworkSet) {
        await onboardStore.setCorrectNetwork();
      }

      // 检查是否可以领取
      const checkResult = await checkCanClaim();
      if (!checkResult?.canClaim) {
        if (checkResult?.timeRemaining && checkResult.timeRemaining > 0n) {
          const minutes = Number(checkResult.timeRemaining) / 60;
          throw new Error(`Please wait ${Math.ceil(minutes)} minutes before claiming again`);
        }
        throw new Error("You are not eligible to claim tokens at this time");
      }

      claimStatus.value = "waiting-for-signature";

      const hash = await writeContract(wagmiConfig, {
        address: FAUCET_CONTRACT_ADDRESS,
        abi: FaucetABI,
        functionName: "claimTokens",
      });

      claimTransactionHash.value = hash;
      claimStatus.value = "sending";

      // 等待交易确认
      const publicClient = onboardStore.getPublicClient();
      await publicClient.waitForTransactionReceipt({
        hash,
      });

      claimStatus.value = "done";

      // 刷新用户信息和统计数据
      await Promise.all([requestUserClaimInfo({ force: true }), requestFaucetStats({ force: true })]);

      trackEvent("faucet-claimed", {
        token: faucetToken.value?.symbol,
        amount: faucetStats.value?.perClaimAmount.toString(),
      });

      return hash;
    } catch (err) {
      claimError.value = formatError(err as Error);
      claimStatus.value = "not-started";
      captureException({
        error: err as Error,
        parentFunctionName: "claimTokens",
        parentFunctionParams: [],
        filePath: "store/faucet.ts",
      });
      throw err;
    }
  };

  const resetClaimState = () => {
    claimStatus.value = "not-started";
    claimError.value = undefined;
    claimTransactionHash.value = undefined;
  };

  // ==================== 自动刷新 ====================

  // 监听账户变化，重置用户信息
  onboardStore.subscribeOnAccountChange(() => {
    resetUserClaimInfo();
    resetClaimState();
  });

  // 当连接钱包后自动加载数据
  watch(
    () => account.value.address,
    (address) => {
      if (address) {
        requestUserClaimInfo();
        checkCanClaim();
      }
    },
    { immediate: true }
  );

  return {
    // 状态
    faucetStats,
    statsLoading,
    statsError,
    requestFaucetStats,

    userClaimInfo,
    userInfoLoading,
    userInfoError,
    requestUserClaimInfo,

    canClaim,
    canClaimLoading,
    canClaimError,
    checkCanClaim,

    faucetToken,
    tokenLoading,
    tokenError,
    requestFaucetToken,

    // 领取操作
    claimStatus,
    claimError,
    claimTransactionHash,
    claimTokens,
    resetClaimState,
  };
});
