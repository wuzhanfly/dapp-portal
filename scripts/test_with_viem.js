/**
 * 使用 viem 测试（模拟前端）
 */

import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const L1_RPC_URL = "http://13.212.114.138:10575";
const PRIVATE_KEY = "0xc9fd9d8eedf1d07a3ff46bd7370c48db3b4c359f4d0dfd73404c3a27f687dae1";
const BRIDGEHUB = "0xf07b8aa29e38d6014db87497ddc8b7e3a1cf465d";
const SHARED_BRIDGE = "0xC3A77C9FEF8f14F1f39760Cc2376F1eb8d60bE4A";

const BRIDGEHUB_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: "uint256", name: "chainId", type: "uint256" },
          { internalType: "uint256", name: "mintValue", type: "uint256" },
          { internalType: "uint256", name: "l2Value", type: "uint256" },
          { internalType: "uint256", name: "l2GasLimit", type: "uint256" },
          { internalType: "uint256", name: "l2GasPerPubdataByteLimit", type: "uint256" },
          { internalType: "address", name: "refundRecipient", type: "address" },
          { internalType: "address", name: "secondBridgeAddress", type: "address" },
          { internalType: "uint256", name: "secondBridgeValue", type: "uint256" },
          { internalType: "bytes", name: "secondBridgeCalldata", type: "bytes" },
        ],
        internalType: "struct L2TransactionRequestTwoBridgesOuter",
        name: "_request",
        type: "tuple",
      },
    ],
    name: "requestL2TransactionTwoBridges",
    outputs: [{ internalType: "bytes32", name: "canonicalTxHash", type: "bytes32" }],
    stateMutability: "payable",
    type: "function",
  },
];

const bscTestnet = {
  id: 97,
  name: 'BSC Testnet',
  network: 'bsc-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'BNB',
    symbol: 'BNB',
  },
  rpcUrls: {
    default: { http: [L1_RPC_URL] },
    public: { http: [L1_RPC_URL] },
  },
};

async function main() {
  console.log("===========================================");
  console.log("  使用 viem 测试");
  console.log("===========================================\n");

  const account = privateKeyToAccount(PRIVATE_KEY);
  console.log(`地址: ${account.address}\n`);

  const publicClient = createPublicClient({
    chain: bscTestnet,
    transport: http(L1_RPC_URL),
  });

  const walletClient = createWalletClient({
    account,
    chain: bscTestnet,
    transport: http(L1_RPC_URL),
  });

  const request = {
    chainId: 9720n,
    mintValue: 159152812500000n,
    l2Value: 0n,
    l2GasLimit: 550000n,
    l2GasPerPubdataByteLimit: 800n,
    refundRecipient: "0x0000000000000000000000000000000000000000",
    secondBridgeAddress: SHARED_BRIDGE,
    secondBridgeValue: 0n,
    secondBridgeCalldata: "0x01ddaf0a252cd1f313d164bdfededc82da13c72478c33bac7ddad2649434ced2c000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000006a94d74f4300000000000000000000000000007cb5c1c44f7729a34f07bb67603d65d81a8cd16a000000000000000000000000ae13d989dac2f0debff460ac112a837c89baa7cd",
  };

  console.log("请求参数:");
  console.log(JSON.stringify(request, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  , 2));
  console.log();

  try {
    console.log("⏳ 模拟交易...");
    const { request: simulatedRequest } = await publicClient.simulateContract({
      address: BRIDGEHUB,
      abi: BRIDGEHUB_ABI,
      functionName: 'requestL2TransactionTwoBridges',
      args: [request],
      account: account.address,
      value: 0n,
      gasPrice: 3000000000n,
    });
    
    console.log("✅ 模拟成功");
    
    console.log("\n⏳ 发送交易...");
    const hash = await walletClient.writeContract(simulatedRequest);
    console.log(`✅ 交易已发送: ${hash}`);
    
    console.log("\n⏳ 等待确认...");
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`✅ 交易已确认 (区块 ${receipt.blockNumber})\n`);
    
  } catch (error) {
    console.error(`❌ 失败: ${error.message}\n`);
    console.error(error);
    throw error;
  }

  console.log("===========================================");
  console.log("  完成！");
  console.log("===========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n完整错误:");
    console.error(error);
    process.exit(1);
  });
