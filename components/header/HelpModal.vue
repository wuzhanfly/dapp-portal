<template>
  <CommonModal :title="$t('help.title')">
    <div class="-mx-block-padding-1/2">
      <DestinationItem
        label="Discord"
        :description="$t('help.discordDes')"
        as="a"
        href="https://join.zksync.dev/"
        target="_blank"
        :icon="ArrowTopRightOnSquareIcon"
        variant="light"
      >
        <template #image>
          <div class="flex h-full w-full items-center justify-center rounded-full bg-[#5865F2] text-white">
            <IconsDiscord class="h-6 w-6" />
          </div>
        </template>
      </DestinationItem>
      <DestinationItem
        :label="$t('help.faq')"
        :description="$t('help.faqDes')"
        as="a"
        href="https://matterlabs.gitbook.io/zksync-community-hub/support/faq"
        target="_blank"
        :icon="ArrowTopRightOnSquareIcon"
        variant="light"
      >
        <template #image>
          <DestinationIconContainer>
            <QuestionMarkCircleIcon aria-hidden="true" />
          </DestinationIconContainer>
        </template>
      </DestinationItem>
      <DestinationItem
        :label="$t('help.officialDocumentation')"
        :description="$t('help.officialDocumentationDes')"
        as="a"
        href="https://era.zksync.io"
        target="_blank"
        :icon="ArrowTopRightOnSquareIcon"
        variant="light"
      >
        <template #image>
          <DestinationIconContainer>
            <BookOpenIcon aria-hidden="true" />
          </DestinationIconContainer>
        </template>
      </DestinationItem>
    </div>
  </CommonModal>
</template>

<script lang="ts" setup>
import { ArrowTopRightOnSquareIcon, BookOpenIcon, QuestionMarkCircleIcon } from "@heroicons/vue/24/outline";
</script>
