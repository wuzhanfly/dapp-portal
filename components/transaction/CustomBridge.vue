<template>
  <div>
    <CommonAlert
      v-if="customBridgeToken.bridgingDisabled"
      variant="warning"
      size="sm"
      :icon="ExclamationTriangleIcon"
      class="mb-block-gap"
    >
      <p>{{ $t("customBridgeAlert", { symbol: customBridgeToken.symbol }) }}</p>
    </CommonAlert>
    <TypographyCategoryLabel>
      {{
        $t("customBridgeLabel", {
          symbol: customBridgeToken.symbol,
          network: type === "deposit" ? eraNetwork.name : eraNetwork.l1Network?.name,
        })
      }}
    </TypographyCategoryLabel>
    <CommonCardWithLineButtons>
      <DestinationItem
        v-for="(item, index) in displayedBridges"
        :key="index"
        :label="item.label"
        :icon-url="item.iconUrl"
        :href="item.href!"
        :icon="ArrowTopRightOnSquareIcon"
        as="a"
        target="_blank"
      />
    </CommonCardWithLineButtons>
  </div>
</template>

<script lang="ts" setup>
import { ExclamationTriangleIcon, ArrowTopRightOnSquareIcon } from "@heroicons/vue/24/outline";

import { type CustomBridgeToken } from "@/data/customBridgeTokens";

const props = defineProps({
  customBridgeToken: {
    type: Object as PropType<CustomBridgeToken>,
    required: true,
  },
  type: {
    type: String as PropType<"deposit" | "withdraw">,
    required: true,
  },
});

const { eraNetwork } = storeToRefs(useZkSyncProviderStore());
const displayedBridges = computed(() => {
  if (props.type === "deposit") {
    return props.customBridgeToken.bridges
      .map((e) => ({
        ...e,
        href: e.depositUrl,
      }))
      .filter((e) => e.href);
  }
  return props.customBridgeToken.bridges
    .map((e) => ({
      ...e,
      href: e.withdrawUrl,
    }))
    .filter((e) => e.href);
});
</script>
