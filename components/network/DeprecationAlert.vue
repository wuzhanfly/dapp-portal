<template>
  <CommonAlert
    v-if="isAlertVisible"
    variant="warning"
    :icon="ExclamationTriangleIcon"
    class="mb-block-padding-1/2 sm:mb-block-gap"
  >
    <p>
      {{ $t("network.deprecationAlert1", { network: eraNetwork.name }) }}
      <NuxtLink :to="getNetworkUrl(recommendedNetwork!, route.fullPath)" class="underline underline-offset-2">{{
        recommendedNetwork!.name
      }}</NuxtLink>
      {{ $t("network.deprecationAlert2") }} {{ $t("network.forMoreInfo") }}
      <a
        class="underline underline-offset-2"
        href="https://github.com/zkSync-Community-Hub/zksync-developers/discussions/228"
        target="_blank"
        >{{ $t("network.announcement") }}</a
      >
      .
    </p>
  </CommonAlert>
</template>

<script lang="ts" setup>
import { ExclamationTriangleIcon } from "@heroicons/vue/24/outline";

import { chainList, isCustomNode } from "@/data/networks";

const route = useRoute();
const { eraNetwork } = storeToRefs(useZkSyncProviderStore());

const recommendedNetwork = computed(() => {
  return chainList.find((chain) => chain.key === "sepolia");
});
const isAlertVisible = computed(() => {
  return eraNetwork.value.deprecated && recommendedNetwork.value && !isCustomNode;
});
</script>

<style lang="scss" scoped></style>
