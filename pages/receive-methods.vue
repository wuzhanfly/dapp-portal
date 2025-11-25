<template>
  <div>
    <PageTitle :fallback-route="{ name: 'assets' }">{{ $t("common.receive") }}</PageTitle>

    <div class="space-y-4">
      <CommonCardWithLineButtons>
        <DestinationItem
          :label="$t('assets.viewYourAddress')"
          :description="$t('assets.receiveTokens', { network: destinations.era.label })"
          as="RouterLink"
          :to="{ name: 'receive' }"
        >
          <template #image>
            <QrCodeIcon class="p-0.5" />
          </template>
        </DestinationItem>
      </CommonCardWithLineButtons>
      <CommonCardWithLineButtons>
        <DestinationItem
          v-if="eraNetwork.l1Network"
          :label="$t('assets.officialBridge')"
          :description="$t('assets.receiveFromYourNetworkAccount', { network: destinations.ethereum.label })"
          :icon-url="destinations.ethereum.iconUrl"
          as="RouterLink"
          :to="{ name: 'bridge', query: $route.query }"
        />
      </CommonCardWithLineButtons>
      <CommonCardWithLineButtons v-if="isTestnet">
        <DestinationItem
          :label="$t('assets.faucet')"
          :description="$t('assets.receiveTestnetFunds')"
          icon-url="/img/faucet.svg"
          as="a"
          href="https://docs.zksync.io/build/tooling/network-faucets.html"
          target="_blank"
          :icon="ArrowTopRightOnSquareIcon"
        />
      </CommonCardWithLineButtons>
      <CommonCardWithLineButtons v-if="isMainnet && eraNetwork.displaySettings?.showPartnerLinks">
        <DestinationItem
          :label="$t('assets.topUpWithCash')"
          :description="$t('assets.buyTokens')"
          as="a"
          href="https://zksync.dappradar.com/ecosystem?category=non_dapps_on_off_ramps"
          target="_blank"
          :icon="ArrowTopRightOnSquareIcon"
        >
          <template #image>
            <DestinationIconContainer>
              <BanknotesIcon aria-hidden="true" />
            </DestinationIconContainer>
          </template>
        </DestinationItem>
      </CommonCardWithLineButtons>
      <CommonCardWithLineButtons v-if="isMainnet && eraNetwork.displaySettings?.showPartnerLinks">
        <DestinationItem
          :label="$t('assets.bridgeFromOtherNetworks')"
          :description="$t('assets.exploreEcosystem')"
          as="a"
          href="https://zksync.dappradar.com/ecosystem?category=defi_bridge"
          target="_blank"
          :icon="ArrowTopRightOnSquareIcon"
        >
          <template #image>
            <DestinationIconContainer>
              <ArrowsUpDownIcon aria-hidden="true" />
            </DestinationIconContainer>
          </template>
        </DestinationItem>
      </CommonCardWithLineButtons>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ArrowsUpDownIcon, ArrowTopRightOnSquareIcon, BanknotesIcon, QrCodeIcon } from "@heroicons/vue/24/outline";
import { mainnet } from "viem/chains";

const { destinations } = storeToRefs(useDestinationsStore());
const { eraNetwork } = storeToRefs(useZkSyncProviderStore());
const isMainnet = computed(() => eraNetwork.value.l1Network?.id === mainnet.id);
const isTestnet = computed(() => eraNetwork.value.l1Network && eraNetwork.value.l1Network.id !== mainnet.id);
</script>

<style lang="scss" scoped></style>
