<template>
  <CommonCardWithLineButtons v-if="showFaucet" class="faucet-card">
    <div class="p-6">
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="bg-primary-100 dark:bg-primary-900 rounded-full p-3">
            <BeakerIcon class="text-primary-600 h-6 w-6 dark:text-primary-400" />
          </div>
          <div>
            <h3 class="text-lg font-semibold">Need Test Tokens?</h3>
            <p class="text-sm text-neutral-500">Get free tokens from our faucet</p>
          </div>
        </div>
      </div>

      <div v-if="faucetToken && faucetStats" class="mb-4 rounded-lg bg-neutral-100 p-4 dark:bg-neutral-800">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-neutral-500">Available per claim</p>
            <p class="text-lg font-semibold">
              {{ formatClaimAmount(faucetStats.perClaimAmount) }} {{ faucetToken.symbol }}
            </p>
          </div>
          <TokenImage :token="faucetToken" size="md" />
        </div>
      </div>

      <div v-if="isConnected && userClaimInfo" class="mb-4 text-sm">
        <div class="flex justify-between">
          <span class="text-neutral-500">Your claims:</span>
          <span class="font-medium">{{ userClaimInfo.totalClaims.toString() }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-neutral-500">Next available:</span>
          <span class="font-medium">{{ nextClaimDisplay }}</span>
        </div>
      </div>

      <CommonButton as="RouterLink" :to="{ name: 'faucet' }" variant="primary" size="sm" class="w-full">
        <BeakerIcon class="h-5 w-5" />
        <span>Go to Faucet</span>
      </CommonButton>
    </div>
  </CommonCardWithLineButtons>
</template>

<script lang="ts" setup>
import { BeakerIcon } from "@heroicons/vue/24/outline";

import TokenImage from "@/components/token/TokenImage.vue";

const { selectedNetwork } = storeToRefs(useNetworkStore());
const { isConnected } = storeToRefs(useOnboardStore());
const faucetStore = useFaucetStore();
const { faucetStats, userClaimInfo, faucetToken } = storeToRefs(faucetStore);
const { formatClaimAmount, getRemainingCooldown, formatCooldownTime } = useFaucet();

// 只在测试网显示
const showFaucet = computed(() => {
  return selectedNetwork.value.displaySettings?.isTestnet && selectedNetwork.value.faucetContract;
});

// 加载数据
onMounted(() => {
  if (showFaucet.value) {
    faucetStore.requestFaucetStats();
    faucetStore.requestFaucetToken();
    if (isConnected.value) {
      faucetStore.requestUserClaimInfo();
    }
  }
});

// 下次可领取时间显示
const nextClaimDisplay = computed(() => {
  if (!userClaimInfo.value) return "N/A";
  const remaining = getRemainingCooldown(userClaimInfo.value);
  if (remaining <= 0) return "Now";
  return formatCooldownTime(remaining);
});
</script>

<style lang="scss" scoped>
.faucet-card {
  @apply primary-200 dark:border-primary-800 border-2;
}
</style>
