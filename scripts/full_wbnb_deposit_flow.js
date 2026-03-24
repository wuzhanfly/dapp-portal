/**
 * 完整的 WBNB 跨链流程（模拟前端）
 */

const { ethers } = require("ethers");

const L1_RPC_URL = "http://13.212.114.138:10575";
const PRIVATE_KEY = "0xc9fd9d8eedf1d07a3ff46bd7370c48db3b4c359f4d0dfd73404c3a27f687dae1";
const WBNB_ADDRESS = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";
const SHARED_BRIDGE = "0xC3A77C9FEF8f14F1f39760Cc2376F1eb8d60bE4A";
const BRIDGEHUB = "0xf07b8aa29e38d6014db87497ddc8b7e3a1cf465d";

const WBNB_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

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
  console.log("  完整的 WBNB 跨链流程");
  console.log("===========================================\n");

  const provider = new BSCProvider(L1_RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log(`地址: ${wallet.address}\n`);

  const wbnbContract = new ethers.Contract(WBNB_ADDRESS, WBNB_ABI, wallet);
  const bridgehub = new ethers.Contract(BRIDGEHUB, BRIDGEHUB_ABI, wallet);

  const amount = ethers.parseEther("0.02");

  // 步骤 1: 检查授权
  console.log("步骤 1: 检查 WBNB 授权");
  const allowance = await wbnbContract.allowance(wallet.address, SHARED_BRIDGE);
  console.log(`  当前授权: ${ethers.formatEther(allowance)} WBNB`);
  console.log(`  需要: ${ethers.formatEther(amount)} WBNB\n`);

  // 步骤 2: 如果授权不足，进行授权
  if (allowance < amount) {
    console.log("步骤 2: 授权 WBNB 给 SharedBridge");
    const approveTx = await wbnbContract.approve(SHARED_BRIDGE, amount, {
      gasPrice: ethers.parseUnits("3", "gwei"),
      gasLimit: 100000,
    });
    console.log(`  授权交易: ${approveTx.hash}`);
    await approveTx.wait();
    console.log(`  ✅ 授权成功\n`);
  } else {
    console.log("步骤 2: 授权充足，跳过\n");
  }

  // 步骤 3: 跨链
  console.log("步骤 3: 跨链 WBNB");
  const request = {
    chainId: 9720n,
    mintValue: 150804237500000n,
    l2Value: 0n,
    l2GasLimit: 492422n,
    l2GasPerPubdataByteLimit: 800n,
    refundRecipient: ethers.ZeroAddress,
    secondBridgeAddress: SHARED_BRIDGE,
    secondBridgeValue: 0n,
    secondBridgeCalldata: "0x01ddaf0a252cd1f313d164bdfededc82da13c72478c33bac7ddad2649434ced2c00000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000470de4df8200000000000000000000000000007cb5c1c44f7729a34f07bb67603d65d81a8cd16a000000000000000000000000ae13d989dac2f0debff460ac112a837c89baa7cd",
  };

  const tx = await bridgehub.requestL2TransactionTwoBridges(request, {
    value: 0,
    gasPrice: ethers.parseUnits("3", "gwei"),
    gasLimit: 400000,
  });

  console.log(`  跨链交易: ${tx.hash}`);
  const receipt = await tx.wait();
  console.log(`  ✅ 跨链成功 (区块 ${receipt.blockNumber})\n`);

  console.log("===========================================");
  console.log("  完成！");
  console.log("===========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 失败:");
    console.error(error.message);
    process.exit(1);
  });
