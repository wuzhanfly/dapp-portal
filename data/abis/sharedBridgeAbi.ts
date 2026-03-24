// Shared Bridge Contract ABI for BSC ZKStack
// BSC Testnet: 0xc3a77c9fef8f14f1f39760cc2376f1eb8d60be4a
export const SHARED_BRIDGE_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "_chainId", type: "uint256" },
      { internalType: "address", name: "_prevMsgSender", type: "address" },
      { internalType: "uint256", name: "_l2Value", type: "uint256" },
      {
        components: [
          { internalType: "address", name: "l2Contract", type: "address" },
          { internalType: "uint256", name: "l2Value", type: "uint256" },
          { internalType: "bytes", name: "l2Calldata", type: "bytes" },
          { internalType: "uint256", name: "l2GasLimit", type: "uint256" },
          { internalType: "uint256", name: "l2GasPerPubdataByteLimit", type: "uint256" },
          { internalType: "bytes[]", name: "factoryDeps", type: "bytes[]" },
          { internalType: "address", name: "refundRecipient", type: "address" },
        ],
        internalType: "struct L2TransactionRequestTwoBridgesInner",
        name: "_data",
        type: "tuple",
      },
    ],
    name: "bridgehubDeposit",
    outputs: [{ internalType: "bytes32", name: "l2TxHash", type: "bytes32" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_chainId", type: "uint256" },
      { internalType: "address", name: "_l1Token", type: "address" },
    ],
    name: "l2TokenAddress",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
