<template>
  <div>
    <CommonAlert variant="warning" :icon="ExclamationTriangleIcon" class="mb-block-padding-1/2 sm:mb-block-gap">
      <p>
        {{ $t("transaction.transactionReceive1") }}
        <span class="font-medium">{{ eraNetwork.name }}</span
        >, {{ $t("transaction.transactionReceive2") }}
      </p>
    </CommonAlert>
    <CommonContentBlock>
      <div class="grid gap-block-padding-1/2 sm:grid-cols-[max-content_1fr] sm:items-center sm:gap-block-padding">
        <CommonQrCodeStyled>
          <QrCode :value="address" :options="{ margin: 0, width: '100%', style: { padding: '0px' } }" />
        </CommonQrCodeStyled>
        <div class="flex flex-col items-center text-center sm:items-start sm:text-left">
          <div class="flex items-center gap-1 text-neutral-400">
            <IconsEra class="h-6 w-6" />
            <span>{{ $t("transaction.yourAddress", { network: eraNetwork.name }) }}</span>
          </div>
          <div class="break-all sm:text-lg">{{ address }}</div>
          <CommonButton variant="primary" class="mt-block-padding-1/2 w-full" @click="copy()">
            <template v-if="copied">{{ $t("common.copied") }}!</template>
            <template v-else>
              <DocumentDuplicateIcon class="mr-1 h-6 w-6" aria-hidden="true" />
              {{ $t("common.copy") }}
            </template>
          </CommonButton>
        </div>
      </div>
    </CommonContentBlock>
  </div>
</template>

<script lang="ts" setup>
import { DocumentDuplicateIcon, ExclamationTriangleIcon } from "@heroicons/vue/24/outline";

const props = defineProps({
  address: {
    type: String,
    required: true,
  },
  destination: {
    type: Object as PropType<TransactionDestination>,
    required: true,
  },
});

const { copy, copied } = useCopy(computed(() => props.address));
const { eraNetwork } = storeToRefs(useZkSyncProviderStore());
</script>
