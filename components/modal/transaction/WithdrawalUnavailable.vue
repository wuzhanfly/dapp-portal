<template>
  <CommonModal :opened="!eraNetwork.l1Network" :closable="false" title="Withdrawal unavailable">
    <p class="leading-normal">
      {{ $t("transaction.withdrawalUnavailable") }} <span class="font-medium">{{ eraNetwork.name }}</span>
      {{ $t("transaction.sinceNotHaveL1Network") }}
    </p>
    <CommonButton as="RouterLink" :to="{ name: 'assets' }" replace variant="primary" class="mt-4 w-full">
      {{ $t("bridge.goToAssets") }}
    </CommonButton>
  </CommonModal>
</template>

<script lang="ts" setup>
const { eraNetwork } = storeToRefs(useZkSyncProviderStore());
</script>
