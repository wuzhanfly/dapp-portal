<template>
  <div>
    <PageTitle>Token Faucet</PageTitle>

    <template v-if="!isConnected">
      <ConnectWalletBlock>Connect wallet to claim test tokens on {{ l1Network?.name }}</ConnectWalletBlock>
    </template>

    <CommonErrorBlock v-else-if="!isCorrectNetworkSet" class="mb-block-gap">
      <p>Please switch to {{ l1Network?.name }} network</p>
      <CommonButton
        variant="primary"
        size="sm"
        class="mt-4"
        :disabled="switchingNetworkInProgress"
        @click="onboardStore.setCorrectNetwork()"
      >
        <span v-if="switchingNetworkInProgress">Switching...</span>
        <span v-else>Switch Network</span>
      </CommonButton>
    </CommonErrorBlock>

    <template v-else>
      <!-- Faucet 主卡片 -->
      <CommonContentBlock class="mb-block-gap">
        <div v-if="faucetToken" class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-3">
            <div class="h-12 w-12">
              <TokenImage v-if="faucetToken.symbol" :symbol="faucetToken.symbol" :icon-url="faucetToken.iconUrl" />
            </div>
            <div>
              <h3 class="text-xl font-semibold">{{ faucetToken.symbol }}</h3>
              <p class="text-sm text-neutral-500">{{ faucetToken.name }}</p>
            </div>
          </div>
          <div class="text-left sm:text-right">
            <p class="text-sm text-neutral-500">Amount per claim</p>
            <p class="text-2xl font-bold">{{ formattedStats.perClaim }} {{ faucetToken.symbol }}</p>
          </div>
        </div>
        <div v-else-if="tokenLoading" class="flex items-center justify-center py-8">
          <CommonSpinner class="h-8 w-8" />
        </div>
      </CommonContentBlock>

      <!-- 用户信息和领取按钮 -->
      <TypographyCategoryLabel v-if="userClaimInfo">Your Claim Status</TypographyCategoryLabel>
      <CommonCardWithLineButtons v-if="userClaimInfo" class="mb-block-gap">
        <div class="grid grid-cols-1 gap-1 p-4 sm:grid-cols-3">
          <div class="py-2">
            <p class="text-xs text-neutral-500">Total Claims</p>
            <p class="text-lg font-semibold">{{ userClaimInfo.totalClaims.toString() }}</p>
          </div>
          <div class="py-2">
            <p class="text-xs text-neutral-500">Total Received</p>
            <p class="text-lg font-semibold">{{ formatClaimAmount(userClaimInfo.totalAmount) }}</p>
          </div>
          <div class="py-2">
            <p class="text-xs text-neutral-500">Next Available</p>
            <p class="text-lg font-semibold">{{ cooldownDisplay }}</p>
          </div>
        </div>
      </CommonCardWithLineButtons>

      <!-- 领取按钮 -->
      <CommonButton
        variant="primary"
        class="mb-4 w-full"
        :disabled="!isClaimable || claimStatus !== 'not-started'"
        @click="handleClaim"
      >
        <transition v-bind="TransitionPrimaryButtonText" mode="out-in">
          <span v-if="claimStatus === 'processing'">Processing...</span>
          <span v-else-if="claimStatus === 'waiting-for-signature'">Waiting for confirmation</span>
          <span v-else-if="claimStatus === 'sending'" class="flex items-center justify-center gap-2">
            <CommonSpinner class="h-5 w-5" />
            Claiming tokens...
          </span>
          <span v-else-if="claimStatus === 'done'">Claimed Successfully!</span>
          <span v-else-if="!isClaimable && remainingCooldown > 0">
            Wait {{ formatCooldownTime(remainingCooldown) }}
          </span>
          <span v-else-if="!isClaimable">Not Eligible</span>
          <span v-else>Claim Tokens</span>
        </transition>
      </CommonButton>

      <!-- 错误提示 -->
      <CommonErrorBlock v-if="claimError" :retry-button="false" class="mb-4">
        {{ claimError.message }}
      </CommonErrorBlock>

      <!-- 成功提示 -->
      <CommonAlert v-if="claimStatus === 'done'" variant="success" class="mb-block-gap">
        <p>Tokens claimed successfully!</p>
        <a
          v-if="claimTransactionHash && l1BlockExplorerUrl"
          :href="`${l1BlockExplorerUrl}/tx/${claimTransactionHash}`"
          target="_blank"
          class="alert-link"
        >
          View transaction
        </a>
      </CommonAlert>

      <!-- 统计信息 -->
      <TypographyCategoryLabel v-if="faucetStats">Faucet Statistics</TypographyCategoryLabel>
      <CommonCardWithLineButtons v-if="faucetStats" class="mb-block-gap">
        <div class="grid grid-cols-1 gap-1 p-4 sm:grid-cols-3">
          <div class="py-2">
            <p class="text-sm text-neutral-500">Total Distributed</p>
            <p class="text-xl font-bold">{{ formattedStats.distributed }} {{ faucetToken?.symbol }}</p>
          </div>
          <div class="py-2">
            <p class="text-sm text-neutral-500">Total Claimers</p>
            <p class="text-xl font-bold">{{ formattedStats.claimers }}</p>
          </div>
          <div class="py-2">
            <p class="text-sm text-neutral-500">Faucet Balance</p>
            <p class="text-xl font-bold">{{ formattedStats.balance }} {{ faucetToken?.symbol }}</p>
          </div>
        </div>
      </CommonCardWithLineButtons>

      <!-- 使用说明 -->
      <TypographyCategoryLabel>How to Use</TypographyCategoryLabel>
      <CommonCardWithLineButtons>
        <div class="space-y-1 p-4">
          <div class="flex items-start gap-3 py-2">
            <span class="text-primary-500">1.</span>
            <span>Connect your wallet to {{ l1Network?.name }}</span>
          </div>
          <div class="flex items-start gap-3 py-2">
            <span class="text-primary-500">2.</span>
            <span>Click "Claim Tokens" to receive test tokens</span>
          </div>
          <div class="flex items-start gap-3 py-2">
            <span class="text-primary-500">3.</span>
            <span>Wait for the cooldown period before claiming again</span>
          </div>
          <div class="flex items-start gap-3 py-2">
            <span class="text-primary-500">4.</span>
            <span>Use the tokens to test bridging and transactions</span>
          </div>
        </div>
      </CommonCardWithLineButtons>
    </template>
  </div>
</template>

<script lang="ts" setup>
const onboardStore = useOnboardStore();
const faucetStore = useFaucetStore();
const { l1Network, l1BlockExplorerUrl } = storeToRefs(useNetworkStore());
const { isConnected, isCorrectNetworkSet, switchingNetworkInProgress } = storeToRefs(onboardStore);

const { faucetStats, userClaimInfo, faucetToken, tokenLoading, claimStatus, claimError, claimTransactionHash } =
  storeToRefs(faucetStore);

const { formatClaimAmount, getRemainingCooldown, formatCooldownTime, isClaimable, formatStats } = useFaucet();

// 加载数据
onMounted(() => {
  faucetStore.requestFaucetStats();
  faucetStore.requestFaucetToken();
  if (isConnected.value) {
    faucetStore.requestUserClaimInfo();
    faucetStore.checkCanClaim();
  }
});

// 计算剩余冷却时间
const remainingCooldown = ref(0);
const cooldownDisplay = computed(() => {
  if (!userClaimInfo.value) return "N/A";
  if (remainingCooldown.value <= 0) return "Ready to claim";
  return formatCooldownTime(remainingCooldown.value);
});

// 更新冷却时间倒计时
const { reset: resetCooldownTimer } = useInterval(() => {
  remainingCooldown.value = getRemainingCooldown(userClaimInfo.value);
}, 1000);

watch(
  userClaimInfo,
  (info) => {
    if (info) {
      remainingCooldown.value = getRemainingCooldown(info);
      resetCooldownTimer();
    }
  },
  { immediate: true }
);

// 格式化统计数据
const formattedStats = computed(() => formatStats(faucetStats.value));

// 领取代币
const handleClaim = async () => {
  try {
    await faucetStore.claimTokens();
  } catch (error) {
    // 错误已在 store 中处理
  }
};

// SEO
useSeoMeta({
  title: "Token Faucet - Get Test Tokens",
  description: "Claim free test tokens for testing bridging and transactions",
});
</script>
