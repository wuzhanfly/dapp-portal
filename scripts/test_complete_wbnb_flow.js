/**
 * 测试完整的 WBNB 跨链流程（模拟前端完整流程）
 * 包括：检查余额 -> 检查授权 -> 授权（如需要）-> 跨链
 */

const { ethers } = require("ethers");

const L1_RPC_URL = "http://13.212.114.138:10575";
const PRIVATE_KEY = "0xc9fd9d8eedf1d07a3ff46bd7370c48db3b4c359f4d0dfd73404c3a27f687dae1";
const WBNB_ADDRESS = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";
const SHARED_BRIDGE = "0xC3A77C9FEF8f14F1f39760Cc2376F1eb8d60bE4A";
const BRIDGEHUB = "0xf07b8aa29e38d6014db87497ddc8b7e3a1cf465d";

const WBNB_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

const BRIDGEHUB_ABI = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_chainId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_gasPrice",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_l2GasLimit",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_l2GasPerPubdataByteLimit",
        type: "uint256",
      },
    ],
    name: "l2TransactionBaseCost",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
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

/**
 * 生成 secondBridgeCalldata（NTV encoding）
 */
function generateSecondBridgeCalldata(l1ChainId, tokenAddress, amount, receiver) {
  const L2_NATIVE_TOKEN_VAULT = "0x0000000000000000000000000000000000010004";

  // 1. 计算 assetId
  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
    ["uint256", "address", "address"],
    [l1ChainId, L2_NATIVE_TOKEN_VAULT, tokenAddress]
  );
  const assetId = ethers.keccak256(encoded);

  // 2. 编码 transferData
  const transferData = ethers.AbiCoder.defaultAbiCoder().encode(
    ["uint256", "address", "address"],
    [amount, receiver, tokenAddress]
  );

  // 3. 编码 secondBridgeData (v1)
  const data = ethers.AbiCoder.defaultAbiCoder().encode(["bytes32", "bytes"], [assetId, transferData]);

  // 4. 添加版本前缀 0x01
  return "0x01" + data.slice(2);
}

async function main() {
  console.log("===========================================");
  console.log("  完整的 WBNB 跨链流程测试");
  console.log("===========================================\n");

  const provider = new BSCProvider(L1_RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log(`地址: ${wallet.address}\n`);

  const wbnbContract = new ethers.Contract(WBNB_ADDRESS, WBNB_ABI, wallet);
  const bridgehub = new ethers.Contract(BRIDGEHUB, BRIDGEHUB_ABI, wallet);

  const amount = ethers.parseEther("0.02");

  // ========================================
  // 步骤 1: 检查 WBNB 余额
  // ========================================
  console.log("步骤 1: 检查 WBNB 余额");
  const balance = await wbnbContract.balanceOf(wallet.address);
  console.log(`  WBNB 余额: ${ethers.formatEther(balance)} WBNB`);

  if (balance < amount) {
    console.log(`  ❌ 余额不足！需要 ${ethers.formatEther(amount)} WBNB\n`);
    process.exit(1);
  }
  console.log(`  ✅ 余额充足\n`);

  // ========================================
  // 步骤 2: 检查 WBNB 授权
  // ========================================
  console.log("步骤 2: 检查 WBNB 授权给 SharedBridge");
  const allowance = await wbnbContract.allowance(wallet.address, SHARED_BRIDGE);
  console.log(`  当前授权: ${ethers.formatEther(allowance)} WBNB`);
  console.log(`  需要授权: ${ethers.formatEther(amount)} WBNB\n`);

  // ========================================
  // 步骤 3: 授权 WBNB（如果需要）
  // ========================================
  if (allowance < amount) {
    console.log("步骤 3: 授权 WBNB 给 SharedBridge");
    console.log(`  目标地址: ${SHARED_BRIDGE}`);

    const approveTx = await wbnbContract.approve(SHARED_BRIDGE, amount, {
      gasPrice: ethers.parseUnits("3", "gwei"),
      gasLimit: 100000,
    });

    console.log(`  授权交易: ${approveTx.hash}`);
    const approveReceipt = await approveTx.wait();
    console.log(`  ✅ 授权成功 (区块 ${approveReceipt.blockNumber})\n`);

    // 等待 2 秒确保授权生效
    await new Promise((resolve) => setTimeout(resolve, 2000));
  } else {
    console.log("步骤 3: 授权充足，跳过\n");
  }

  // ========================================
  // 步骤 4: 计算跨链参数
  // ========================================
  console.log("步骤 4: 计算跨链参数");

  const chainId = 9720n;
  const l2GasLimit = 550000n;
  const gasPerPubdata = 800n;
  const gasPrice = ethers.parseUnits("3", "gwei");

  // 调用 Bridgehub 获取 baseCost
  const baseCost = await bridgehub.l2TransactionBaseCost(chainId, gasPrice, l2GasLimit, gasPerPubdata);
  console.log(`  Base Cost: ${ethers.formatEther(baseCost)} tMai`);

  // 添加 15% 的 operator tip
  const operatorTip = (baseCost * 15n) / 100n;
  const mintValue = baseCost + operatorTip;
  console.log(`  Operator Tip (15%): ${ethers.formatEther(operatorTip)} tMai`);
  console.log(`  Mint Value: ${ethers.formatEther(mintValue)} tMai\n`);

  // 生成 secondBridgeCalldata
  const secondBridgeCalldata = generateSecondBridgeCalldata(97n, WBNB_ADDRESS, amount, wallet.address);
  console.log(`  Second Bridge Calldata: ${secondBridgeCalldata.slice(0, 66)}...\n`);

  // ========================================
  // 步骤 5: 执行跨链
  // ========================================
  console.log("步骤 5: 执行跨链");

  const request = {
    chainId,
    mintValue,
    l2Value: 0n,
    l2GasLimit,
    l2GasPerPubdataByteLimit: gasPerPubdata,
    refundRecipient: ethers.ZeroAddress,
    secondBridgeAddress: SHARED_BRIDGE,
    secondBridgeValue: 0n,
    secondBridgeCalldata,
  };

  console.log("  请求参数:");
  console.log(`    chainId: ${request.chainId}`);
  console.log(`    mintValue: ${ethers.formatEther(request.mintValue)} tMai`);
  console.log(`    l2GasLimit: ${request.l2GasLimit}`);
  console.log(`    secondBridgeAddress: ${request.secondBridgeAddress}\n`);

  const tx = await bridgehub.requestL2TransactionTwoBridges(request, {
    value: 0,
    gasPrice,
    gasLimit: 400000,
  });

  console.log(`  跨链交易: ${tx.hash}`);
  const receipt = await tx.wait();
  console.log(`  ✅ 跨链成功 (区块 ${receipt.blockNumber})\n`);

  console.log("===========================================");
  console.log("  ✅ 完整流程测试成功！");
  console.log("===========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 测试失败:");
    console.error(error.message);
    if (error.data) {
      console.error("错误数据:", error.data);
    }
    process.exit(1);
  });
