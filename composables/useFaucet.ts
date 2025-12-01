import { formatUnits } from "viem";

import type { FaucetUserInfo, FaucetStats } from "@/store/faucet";

/**
 * Faucet 相关的辅助函数
 */
export const useFaucet = () => {
  const faucetStore = useFaucetStore();
  const { faucetToken } = storeToRefs(faucetStore);

  /**
   * 格式化领取金额
   */
  const formatClaimAmount = (amount: bigint | undefined) => {
    if (!amount || !faucetToken.value) return "0";
    return formatUnits(amount, faucetToken.value.decimals);
  };

  /**
   * 计算剩余冷却时间（秒）
   */
  const getRemainingCooldown = (userInfo: FaucetUserInfo | undefined): number => {
    if (!userInfo || userInfo.lastClaimTime === 0n) return 0;

    const now = BigInt(Math.floor(Date.now() / 1000));
    if (now >= userInfo.nextAvailableClaim) return 0;

    return Number(userInfo.nextAvailableClaim - now);
  };

  /**
   * 格式化冷却时间显示
   */
  const formatCooldownTime = (seconds: number): string => {
    if (seconds <= 0) return "Ready to claim";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  /**
   * 检查是否可以领取
   */
  const isClaimable = computed(() => {
    const { canClaim, userClaimInfo } = storeToRefs(faucetStore);
    return canClaim.value?.canClaim && userClaimInfo.value?.isEligible;
  });

  /**
   * 获取领取进度百分比
   */
  const getClaimProgress = (userInfo: FaucetUserInfo | undefined, maxClaims: number): number => {
    if (!userInfo) return 0;
    return (Number(userInfo.totalClaims) / maxClaims) * 100;
  };

  /**
   * 格式化统计数据
   */
  const formatStats = (stats: FaucetStats | undefined) => {
    if (!stats || !faucetToken.value) {
      return {
        distributed: "0",
        claimers: "0",
        balance: "0",
        perClaim: "0",
      };
    }

    return {
      distributed: formatUnits(stats.distributed, faucetToken.value.decimals),
      claimers: stats.claimers.toString(),
      balance: formatUnits(stats.faucetBalance, faucetToken.value.decimals),
      perClaim: formatUnits(stats.perClaimAmount, faucetToken.value.decimals),
    };
  };

  return {
    formatClaimAmount,
    getRemainingCooldown,
    formatCooldownTime,
    isClaimable,
    getClaimProgress,
    formatStats,
  };
};
