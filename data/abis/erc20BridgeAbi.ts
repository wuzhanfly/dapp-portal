// ERC20 Bridge Contract ABI for BSC ZKStack
// BSC Testnet: 0xaed878b4f465fa5cd1f64c35aa5a340e2506febd
export const ERC20_BRIDGE_ABI = [
  {
    inputs: [
      { internalType: "address", name: "_l2Receiver", type: "address" },
      { internalType: "address", name: "_l1Token", type: "address" },
      { internalType: "uint256", name: "_amount", type: "uint256" },
      { internalType: "uint256", name: "_l2TxGasLimit", type: "uint256" },
      { internalType: "uint256", name: "_l2TxGasPerPubdataByte", type: "uint256" },
      { internalType: "address", name: "_refundRecipient", type: "address" },
    ],
    name: "deposit",
    outputs: [{ internalType: "bytes32", name: "l2TxHash", type: "bytes32" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "l2Bridge",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_l1Token", type: "address" }],
    name: "l2TokenAddress",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
