<template>
  <div>
    <h1 class="h1 mt-block-gap-1/2 text-center">
      {{ transaction.info.completed ? "Transaction completed" : "Transaction submitted" }}
    </h1>
    <CommonHeightTransition :opened="!transaction.info.completed">
      <p class="mb-4 text-center">
        {{ $t("transactions.completed1") }}
        <a
          v-if="blockExplorerUrl"
          :href="`${blockExplorerUrl}/address/${transaction!.to.address}`"
          target="_blank"
          class="font-medium underline underline-offset-2"
          >{{ $t("transactions.completed2") }}</a
        >
        <span v-else>{{ $t("transactions.completed2") }}</span>
        {{ $t("transactions.completed3") }}
        <span class="font-medium">{{ transaction.from.destination.label }}</span
        >{{ $t("transactions.completed4") }}
      </p>
    </CommonHeightTransition>
    <TransactionProgress
      :from-address="transaction.from.address"
      :from-destination="transaction.from.destination"
      :to-address="transaction.to.address"
      :to-destination="transaction.to.destination"
      :explorer-link="blockExplorerUrl"
      :transaction-hash="transaction.transactionHash"
      :token="transaction.token"
      :completed="transaction.info.completed"
      :failed="transaction.info.failed"
    />

    <CommonButton as="RouterLink" :to="{ name: 'assets' }" class="mt-block-gap" variant="primary">
      {{ $t("bridge.goToAssets") }}
    </CommonButton>
    <CommonButton
      size="sm"
      :as="makeAnotherTransaction ? undefined : 'RouterLink'"
      :to="{ name: 'send' }"
      class="mx-auto mt-block-gap w-max"
      @click="makeAnotherTransaction && makeAnotherTransaction()"
    >
      {{ $t("transactions.makeAnotherTransaction") }}
    </CommonButton>
  </div>
</template>

<script lang="ts" setup>
defineProps({
  transaction: {
    type: Object as PropType<TransactionInfo>,
    required: true,
  },
  makeAnotherTransaction: {
    type: Function as PropType<() => void>,
    required: false,
  },
});

const { blockExplorerUrl } = storeToRefs(useZkSyncProviderStore());
</script>
