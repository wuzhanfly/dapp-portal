window.config = {
  app: {
    environment: "testnet",
    name: "ZKsync Bridge",
    version: "1.0.0",
  },
  hyperchains: [
    {
      network: {
        id: 9720,
        key: "zk_bsc_chain",
        name: "ZK BSC Chain",
        rpcUrl: "http://13.228.79.240:3050/",
        blockExplorerUrl: "https://testnet.maiscan.org/",
        blockExplorerApi: "https://testnet-bridge.maichain.org/api",
        l1Network: {
          id: 97,
          name: "BSC Testnet",
          network: "bsc-testnet",
          nativeCurrency: {
            name: "Test BNB",
            symbol: "TBNB",
            decimals: 18,
          },
          rpcUrls: {
            default: {
              http: ["https://bsc-mainnet.nodereal.io/v1/14bdb3a539eb418bb709ccbd711b482c"],
            },
            public: {
              http: ["https://bsc-mainnet.nodereal.io/v1/14bdb3a539eb418bb709ccbd711b482c"],
            },
          },
          blockExplorers: {
            default: {
              name: "BSC Testnet Explorer",
              url: "https://testnet.bscscan.com",
            },
          },
        },
        displaySettings: {
          onramp: false,
          showPartnerLinks: false,
          isTestnet: true,
        },
      },

      tokens: [
        {
          address: "0x000000000000000000000000000000000000800A",
          symbol: "BNB",
          decimals: 18,
          l1Address: "0x0000000000000000000000000000000000000000",
          name: "Test BNB",
          iconUrl: "/img/bnb.svg",
        },
      ],
    },
  ],
};
