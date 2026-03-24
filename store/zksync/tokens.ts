import { $fetch } from "ofetch";
import { utils } from "zksync-ethers";

import { customBridgeTokens } from "@/data/customBridgeTokens";

import type { Api, Token } from "@/types";

export const useZkSyncTokensStore = defineStore("zkSyncTokens", () => {
  const providerStore = useZkSyncProviderStore();
  const { eraNetwork } = storeToRefs(providerStore);

  const {
    result: tokensRaw,
    inProgress: tokensRequestInProgress,
    error: tokensRequestError,
    execute: requestTokens,
    reset: resetTokens,
  } = usePromise<Token[]>(async () => {
    const provider = await providerStore.requestProvider();
    const ethL2TokenAddress = await provider.l2TokenAddress(utils.ETH_ADDRESS);

    let baseToken = null;
    let ethToken = null;
    let explorerTokens: Token[] = [];
    let configTokens: Token[] = [];

    if (eraNetwork.value.blockExplorerApi) {
      const responses: Api.Response.Collection<Api.Response.Token>[] = await Promise.all([
        $fetch(`${eraNetwork.value.blockExplorerApi}/tokens?limit=100&page=1`),
        $fetch(`${eraNetwork.value.blockExplorerApi}/tokens?limit=100&page=2`),
        $fetch(`${eraNetwork.value.blockExplorerApi}/tokens?limit=100&page=3`),
      ]);
      explorerTokens = responses.map((response) => response.items.map(mapApiToken)).flat();
      baseToken = explorerTokens.find((token) => token.address.toUpperCase() === L2_BASE_TOKEN_ADDRESS.toUpperCase());
      ethToken = explorerTokens.find((token) => token.address.toUpperCase() === ethL2TokenAddress.toUpperCase());
    }

    if (eraNetwork.value.getTokens && (!baseToken || !ethToken)) {
      configTokens = await eraNetwork.value.getTokens();
      if (!baseToken) {
        baseToken = configTokens.find((token) => token.address.toUpperCase() === L2_BASE_TOKEN_ADDRESS.toUpperCase());
      }
      if (!ethToken) {
        ethToken = configTokens.find((token) => token.address.toUpperCase() === ethL2TokenAddress.toUpperCase());
      }
    }

    if (!baseToken) {
      baseToken = {
        address: L2_BASE_TOKEN_ADDRESS,
        l1Address: eraNetwork.value.l1Network ? await provider.getBaseTokenContractAddress() : undefined,
        symbol: "BASETOKEN",
        name: "Base Token",
        decimals: 18,
        iconUrl: "/img/eth.svg",
      };
    }
    if (!ethToken) {
      // For BSC-based chains, the native token is BNB, not ETH
      const isBscChain = eraNetwork.value.l1Network?.id === 97 || eraNetwork.value.l1Network?.id === 56;
      
      ethToken = {
        address: ethL2TokenAddress,
        l1Address: utils.ETH_ADDRESS,
        symbol: isBscChain ? "BNB" : "ETH",
        name: isBscChain ? "BNB" : "Ether",
        decimals: 18,
        iconUrl: isBscChain ? "/img/bnb.svg" : "/img/eth.svg",
      };
    }

    // Merge explorer tokens and config tokens
    // For tokens that exist in both, use config token properties (like iconUrl) to override API values
    const allTokens = [...explorerTokens];
    for (const configToken of configTokens) {
      const existingTokenIndex = allTokens.findIndex(
        (t) => t.address.toUpperCase() === configToken.address.toUpperCase()
      );
      if (existingTokenIndex >= 0) {
        // Token exists in API, merge config properties (iconUrl, l1Address, etc.)
        allTokens[existingTokenIndex] = {
          ...allTokens[existingTokenIndex],
          ...configToken,
          // Keep API values for these if they exist
          ...(allTokens[existingTokenIndex].name && { name: allTokens[existingTokenIndex].name }),
          ...(allTokens[existingTokenIndex].symbol && { symbol: allTokens[existingTokenIndex].symbol }),
        };
      } else {
        // Token doesn't exist in API, add it from config
        allTokens.push(configToken);
      }
    }

    const nonBaseOrEthTokens = allTokens.filter(
      (token) => token.address !== L2_BASE_TOKEN_ADDRESS && token.address !== ethL2TokenAddress
    );
    
    // For Base Token chains, include the native L1 token (BNB for BSC, ETH for Ethereum)
    // Check if baseToken is different from ethToken
    const shouldIncludeNativeToken = baseToken.address.toUpperCase() !== ethL2TokenAddress.toUpperCase();
    
    return [
      baseToken,
      // Include native L1 token (BNB/ETH) for Base Token chains
      ...(shouldIncludeNativeToken && ethToken ? [ethToken] : []),
      ...nonBaseOrEthTokens,
    ].map((token) => ({
      ...token,
      isETH: token.address.toUpperCase() === ethL2TokenAddress.toUpperCase(),
    }));
  });

  const tokens = computed<{ [tokenAddress: string]: Token } | undefined>(() => {
    if (!tokensRaw.value) return undefined;
    return Object.fromEntries(tokensRaw.value.map((token) => [token.address, token]));
  });
  const l1Tokens = computed<{ [tokenAddress: string]: Token } | undefined>(() => {
    if (!tokensRaw.value) return undefined;
    return Object.fromEntries(
      tokensRaw.value
        .filter((e) => e.l1Address)
        .map((token) => {
          const customBridgeToken = customBridgeTokens.find(
            (e) => eraNetwork.value.l1Network?.id === e.chainId && token.l1Address === e.l1Address
          );
          const name = customBridgeToken?.name || token.name;
          const symbol = customBridgeToken?.symbol || token.symbol;
          return [token.l1Address!, { ...token, name, symbol, l1Address: undefined, address: token.l1Address! }];
        })
    );
  });
  const baseToken = computed<Token | undefined>(() => {
    if (!tokensRaw.value) return undefined;
    return tokensRaw.value.find((token) => token.address.toUpperCase() === L2_BASE_TOKEN_ADDRESS.toUpperCase());
  });
  const ethToken = computed<Token | undefined>(() => {
    if (!tokensRaw.value) return undefined;
    return tokensRaw.value.find((token) => token.isETH);
  });

  return {
    l1Tokens,
    tokens,
    baseToken,
    ethToken,
    tokensRequestInProgress: computed(() => tokensRequestInProgress.value),
    tokensRequestError: computed(() => tokensRequestError.value),
    requestTokens,
    resetTokens,
  };
});
