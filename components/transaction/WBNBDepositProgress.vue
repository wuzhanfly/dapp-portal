<template>
  <CommonContentBlock class="wbnb-deposit-progress">
    <div class="mb-4 text-center">
      <h3 class="text-lg font-medium">{{ $t("bridge.wbnbDepositSteps") }}</h3>
      <p class="mt-1 text-sm text-neutral-400">{{ $t("bridge.wbnbDepositDescription") }}</p>
    </div>

    <div class="steps-container">
      <div :class="['step', { active: isStepActive('wrap'), done: isStepDone('wrap') }]">
        <div class="step-indicator">
          <div class="step-number">
            <CheckIcon v-if="isStepDone('wrap')" class="h-4 w-4" />
            <span v-else>1</span>
          </div>
          <div v-if="!isLastStep('wrap')" class="step-line" />
        </div>
        <div class="step-content">
          <div class="step-label">{{ $t("bridge.wrapBNB") }}</div>
          <div class="step-description">{{ $t("bridge.wrapBNBDescription") }}</div>
          <a
            v-if="wrapTxHash && l1BlockExplorerUrl"
            :href="`${l1BlockExplorerUrl}/tx/${wrapTxHash}`"
            target="_blank"
            class="step-link"
          >
            {{ $t("transaction.viewOnExplorer") }}
            <ArrowTopRightOnSquareIcon class="h-4 w-4" />
          </a>
        </div>
      </div>

      <div :class="['step', { active: isStepActive('approve'), done: isStepDone('approve') }]">
        <div class="step-indicator">
          <div class="step-number">
            <CheckIcon v-if="isStepDone('approve')" class="h-4 w-4" />
            <span v-else>2</span>
          </div>
          <div v-if="!isLastStep('approve')" class="step-line" />
        </div>
        <div class="step-content">
          <div class="step-label">{{ $t("bridge.approveWBNB") }}</div>
          <div class="step-description">{{ $t("bridge.approveWBNBDescription") }}</div>
          <a
            v-if="approveTxHash && l1BlockExplorerUrl"
            :href="`${l1BlockExplorerUrl}/tx/${approveTxHash}`"
            target="_blank"
            class="step-link"
          >
            {{ $t("transaction.viewOnExplorer") }}
            <ArrowTopRightOnSquareIcon class="h-4 w-4" />
          </a>
        </div>
      </div>

      <div :class="['step', { active: isStepActive('deposit'), done: isStepDone('deposit') }]">
        <div class="step-indicator">
          <div class="step-number">
            <CheckIcon v-if="isStepDone('deposit')" class="h-4 w-4" />
            <span v-else>3</span>
          </div>
        </div>
        <div class="step-content">
          <div class="step-label">{{ $t("bridge.depositToL2") }}</div>
          <div class="step-description">{{ $t("bridge.depositToL2Description") }}</div>
          <a
            v-if="depositTxHash && l1BlockExplorerUrl"
            :href="`${l1BlockExplorerUrl}/tx/${depositTxHash}`"
            target="_blank"
            class="step-link"
          >
            {{ $t("transaction.viewOnExplorer") }}
            <ArrowTopRightOnSquareIcon class="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  </CommonContentBlock>
</template>

<script lang="ts" setup>
import { ArrowTopRightOnSquareIcon, CheckIcon } from "@heroicons/vue/24/outline";

import type { WBNBDepositStep } from "@/composables/zksync/deposit/useWBNBDeposit";
import type { Hash } from "viem";

const props = defineProps<{
  currentStep: WBNBDepositStep | null;
  wrapTxHash?: Hash;
  approveTxHash?: Hash;
  depositTxHash?: Hash;
}>();

const { l1BlockExplorerUrl } = storeToRefs(useNetworkStore());

const stepOrder: WBNBDepositStep[] = ["wrap", "approve", "deposit"];

const isStepActive = (step: WBNBDepositStep) => {
  return props.currentStep === step;
};

const isStepDone = (step: WBNBDepositStep) => {
  if (!props.currentStep) return false;
  const currentIndex = stepOrder.indexOf(props.currentStep);
  const stepIndex = stepOrder.indexOf(step);
  return currentIndex > stepIndex || props.currentStep === "done";
};

const isLastStep = (step: WBNBDepositStep) => {
  return step === stepOrder[stepOrder.length - 1];
};
</script>

<style lang="scss" scoped>
.wbnb-deposit-progress {
  @apply mb-block-gap;
}

.steps-container {
  @apply flex flex-col gap-4;
}

.step {
  @apply flex gap-4 opacity-50 transition-opacity;

  &.active,
  &.done {
    @apply opacity-100;
  }

  .step-indicator {
    @apply relative flex flex-col items-center;

    .step-number {
      @apply flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-neutral-300 bg-neutral-100 font-medium text-neutral-600 transition-colors;
    }

    .step-line {
      @apply mt-2 w-0.5 flex-1 bg-neutral-300;
      min-height: 2rem;
    }
  }

  &.active .step-indicator .step-number {
    @apply border-primary-400 bg-primary-400 text-white;
  }

  &.done .step-indicator .step-number {
    @apply border-success-400 bg-success-400 text-white;
  }

  .step-content {
    @apply flex flex-1 flex-col gap-1 pb-4;

    .step-label {
      @apply font-medium;
    }

    .step-description {
      @apply text-sm text-neutral-500;
    }

    .step-link {
      @apply mt-1 inline-flex items-center gap-1 text-sm text-primary-400 underline underline-offset-2 hover:text-primary-300;
    }
  }
}
</style>
