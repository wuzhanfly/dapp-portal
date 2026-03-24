/**
 * 模拟前端调用
 */

const { ethers } = require("ethers");

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

class BSCProvider extends ethers.JsonRpcProvider {
  async getFeeData() {
    return {
      maxFeePerGas: null,
      maxPriorityFeePerGas: null,
      gasPrice: ethers.parseUnits("3", "gwei"),
    };
  }
}

async function main() {
  console.log("===========================================");
  console.log("  模拟前端调用");
  console.log("===========================================\n");

  const provider = new BSCProvider(L1_RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log(`地址: ${wallet.address}\n`);

  // 使用 SDK 的参数
  const request = {
    chainId: 9720n,
    mintValue: 150804237500000n, // SDK 的值
    l2Value: 0n,
    l2GasLimit: 492422n, // SDK 的值
    l2GasPerPubdataByteLimit: 800n,
    refundRecipient: ethers.ZeroAddress,
    secondBridgeAddress: SHARED_BRIDGE,
    secondBridgeValue: 0n,
    secondBridgeCalldata: "0x01ddaf0a252cd1f313d164bdfededc82da13c72478c33bac7ddad2649434ced2c00000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000470de4df8200000000000000000000000000007cb5c1c44f7729a34f07bb67603d65d81a8cd16a000000000000000000000000ae13d989dac2f0debff460ac112a837c89baa7cd",
  };

  console.log("请求参数:");
  console.log(JSON.stringify(request, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  , 2));
  console.log();

  const bridgehub = new ethers.Contract(BRIDGEHUB, BRIDGEHUB_ABI, wallet);

  try {
    console.log("⏳ 尝试调用 requestL2TransactionTwoBridges...");
    
    // 先尝试 estimateGas
    const gasEstimate = await bridgehub.requestL2TransactionTwoBridges.estimateGas(
      request,
      { value: 0, gasPrice: ethers.parseUnits("3", "gwei") }
    );
    console.log(`✅ Gas 估算成功: ${gasEstimate}`);
    
    // 发送交易
    const tx = await bridgehub.requestL2TransactionTwoBridges(
      request,
      { 
        value: 0,
        gasPrice: ethers.parseUnits("3", "gwei"),
        gasLimit: gasEstimate * 130n / 100n, // 30% buffer
      }
    );
    
    console.log(`✅ 交易已发送: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`✅ 交易已确认 (区块 ${receipt.blockNumber})\n`);
    
  } catch (error) {
    console.error(`❌ 调用失败: ${error.message}\n`);
    
    if (error.data) {
      console.error(`错误数据: ${error.data}`);
    }
    
    // 尝试解码错误
    if (error.error && error.error.data) {
      console.error(`原始错误数据: ${error.error.data}`);
    }
    
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
