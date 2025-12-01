<template>
  <div v-if="showQuickClaim" class="quick-claim-container">
    <CommonAlert variant="info" class="mb-4">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <BeakerIcon class="h-6 w-6" />
          <div>
            <p class="font-medium">Need test tokens?</p>
            <p class="text-sm">
              Claim {{ formatClaimAmount(faucetStats?.perClaimAmount) }} {{ faucetToken?.symbol }} from faucet
            </p>
          </div>
        </div>
        <CommonButton
          v-if="isClaimable"
          variant="primary"
          size="sm"
          :disabled="claimStatus !== 'not-started'"
          @click="handleQuickClaim"
        >
          <transition v-bind="TransitionPrimaryButtonText" mode="out-in">
            <span v-if="claimStatus === 'processing'">Processing...</span>
            <span v-else-if="claimStatus === 'waiting-for-signature'">Confirm</span>
            <span v-else-if="claimStatus === 'sending'">Claiming...</span>
            <span v-else-if="claimStatus === 'done'">Claimed!</span>
            <span v-else>Quick Claim</span>
          </transition>
        </CommonButton>
        <CommonButton v-else as="RouterLink" :to="{ name: 'faucet' }" variant="light" size="sm">
          View Faucet
        </CommonButton>
      </div>
    </CommonAlert>

    <CommonErrorBlock v-if="claimError" :retry-button="false" class="mb-4">
      {{ claimError.message }}
    </CommonErrorBlock>
  </div>
</template>

<script lang="ts" setup>
import { BeakerIcon } from "@heroicons/vue/24/outline";

const props = defineProps<{
  showWhenBalance?: string; // 当余额低于此值时显示
}>();

const { selectedNetwork } = storeToRefs(useNetworkStore());
const { isConnected, isCorrectNetworkSet } = storeToRefs(useOnboardStore());
const zkSyncEthereumBalance = useZkSyncEthereumBalanceStore();
const { balance } = storeToRefs(zkSyncEthereumBalance);

const faucetStore = useFaucetStore();
const { faucetStats, faucetToken, claimStatus, claimError } = storeToRefs(faucetStore);

const { formatClaimAmount, isClaimable } = useFaucet();

// 判断是否显示快速领取
const showQuickClaim = computed(() => {
  if (!selectedNetwork.value.displaySettings?.isTestnet) return false;
  if (!selectedNetwork.value.faucetContract) return false;
  if (!isConnected.value) return false;
  if (!isCorrectNetworkSet.value) return false;

  // 如果设置了余额阈值,检查余额
  if (props.showWhenBalance && balance.value && faucetToken.value) {
    const tokenBalance = balance.value.find(
      (b) => b.address.toLowerCase() === faucetToken.value?.l1Address?.toLowerCase()
    );
    if (tokenBalance) {
      const balanceValue = BigInt(tokenBalance.amount);
      const threshold = BigInt(props.showWhenBalance);
      if (balanceValue >= threshold) return false;
    }
  }

  return true;
});

// 快速领取
const handleQuickClaim = async () => {
  try {
    await faucetStore.claimTokens();
    // 刷新余额
    await zkSyncEthereumBalance.requestBalance();
  } catch (error) {
    // 错误已在 store 中处理
  }
};

// 加载数据
onMounted(() => {
  if (showQuickClaim.value) {
    faucetStore.requestFaucetStats();
    faucetStore.requestFaucetToken();
    faucetStore.requestUserClaimInfo();
    faucetStore.checkCanClaim();
  }
});
</script>
