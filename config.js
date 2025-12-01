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
        rpcUrl: "https://testnet-node-0.maichain.org/",
        blockExplorerUrl: "https://testnet.maiscan.org/",
        blockExplorerApi: "http://54.255.170.191:3002",
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
              http: [
                "https://rpc.ankr.com/bsc_testnet_chapel/a948b7471d1af62abb0a6a4af74da3d1b7616df9c666ff566a0d0a0433e7be5c",
              ],
            },
            public: {
              http: [
                "https://rpc.ankr.com/bsc_testnet_chapel/a948b7471d1af62abb0a6a4af74da3d1b7616df9c666ff566a0d0a0433e7be5c",
              ],
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
