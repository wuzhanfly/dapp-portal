<template>
  <CommonButton
    v-if="showFaucetButton"
    as="RouterLink"
    :to="{ name: 'faucet' }"
    variant="light"
    size="sm"
    class="gap-2"
  >
    <BeakerIcon class="h-5 w-5" />
    <span>Get Test Tokens</span>
  </CommonButton>
</template>

<script lang="ts" setup>
import { BeakerIcon } from "@heroicons/vue/24/outline";

const { selectedNetwork } = storeToRefs(useNetworkStore());

// 只在测试网显示 Faucet 按钮
const showFaucetButton = computed(() => {
  return selectedNetwork.value.displaySettings?.isTestnet;
});
</script>
