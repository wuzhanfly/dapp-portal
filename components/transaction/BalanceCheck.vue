<template>
  <CommonContentBlock class="balance-check">
    <div class="balance-header">
      <h4 class="text-sm font-medium">{{ $t("bridge.balanceCheck") }}</h4>
    </div>

    <div class="balance-items">
      <div class="balance-item">
        <div class="balance-label">
          <span>{{ $t("bridge.l1Balance") }} ({{ l1Symbol }}):</span>
        </div>
        <div :class="['balance-value', { insufficient: !hasEnoughL1 }]">
          {{ formatBalance(l1Balance) }} {{ l1Symbol }}
          <CheckIcon v-if="hasEnoughL1" class="h-4 w-4 text-success-600" />
          <ExclamationTriangleIcon v-else class="h-4 w-4 text-warning-600" />
        </div>
      </div>

      <div class="balance-item">
        <div class="balance-label">
          <span>{{ $t("bridge.l2Balance") }} ({{ l2Symbol }}):</span>
        </div>
        <div :class="['balance-value', { insufficient: !hasEnoughL2 }]">
          {{ formatBalance(l2Balance) }} {{ l2Symbol }}
          <CheckIcon v-if="hasEnoughL2" class="h-4 w-4 text-success-600" />
          <ExclamationTriangleIcon v-else class="h-4 w-4 text-warning-600" />
        </div>
      </div>
    </div>

    <CommonHeightTransition :opened="!hasEnoughL1 || !hasEnoughL2">
      <div class="mt-4">
        <CommonAlert v-if="!hasEnoughL1" variant="error" :icon="ExclamationTriangleIcon" class="mb-2">
          <p>
            {{ $t("bridge.insufficientL1Balance", { symbol: l1Symbol, required: formatBalance(requiredL1) }) }}
          </p>
          <NuxtLink :to="{ name: 'receive-methods' }" class="alert-link">
            {{ $t("transaction.receiveFunds") }}
          </NuxtLink>
        </CommonAlert>

        <CommonAlert v-if="!hasEnoughL2" variant="warning" :icon="ExclamationTriangleIcon">
          <p>
            {{ $t("bridge.insufficientL2Balance", { symbol: l2Symbol, required: formatBalance(requiredL2) }) }}
          </p>
          <p class="mt-2">
            {{ $t("bridge.needL2GasToken") }}
          </p>
          <NuxtLink v-if="showFaucetLink" :to="{ name: 'faucet' }" class="alert-link">
            {{ $t("bridge.getFaucetTokens") }}
          </NuxtLink>
        </CommonAlert>
      </div>
    </CommonHeightTransition>
  </CommonContentBlock>
</template>

<script lang="ts" setup>
import { CheckIcon, ExclamationTriangleIcon } from "@heroicons/vue/24/outline";

const props = defineProps<{
  l1Balance: string;
  l2Balance: string;
  requiredL1: string;
  requiredL2: string;
  l1Symbol?: string;
  l2Symbol?: string;
}>();

const networkStore = useNetworkStore();
const { selectedNetwork } = storeToRefs(networkStore);

const l1Symbol = computed(() => props.l1Symbol || "BNB");
const l2Symbol = computed(() => props.l2Symbol || "tMai");

const showFaucetLink = computed(() => {
  return selectedNetwork.value.displaySettings?.isTestnet && !!selectedNetwork.value.faucetContract;
});

const hasEnoughL1 = computed(() => {
  try {
    return BigInt(props.l1Balance) >= BigInt(props.requiredL1);
  } catch {
    return true;
  }
});

const hasEnoughL2 = computed(() => {
  try {
    return BigInt(props.l2Balance) >= BigInt(props.requiredL2);
  } catch {
    return true;
  }
});

const formatBalance = (balance: string) => {
  try {
    const value = parseFloat(balance);
    if (value === 0) return "0";
    if (value < 0.0001) return "< 0.0001";
    return value.toFixed(4);
  } catch {
    return balance;
  }
};
</script>

<style lang="scss" scoped>
.balance-check {
  @apply mb-block-gap;
}

.balance-header {
  @apply mb-4 border-b border-neutral-200 pb-2;
}

.balance-items {
  @apply flex flex-col gap-3;
}

.balance-item {
  @apply flex items-center justify-between gap-4;

  .balance-label {
    @apply text-sm text-neutral-600;
  }

  .balance-value {
    @apply flex items-center gap-2 font-medium;

    &.insufficient {
      @apply text-warning-600;
    }
  }
}
</style>
