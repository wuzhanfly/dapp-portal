const { ethers } = require("ethers");
require("dotenv").config();

// 配置
const BSC_TESTNET_RPC = "https://bsc-testnet.bnbchain.org";
const WBNB_ADDRESS = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";
const SHARED_BRIDGE = "0xc3a77c9fef8f14f1f39760cc2376f1eb8d60be4a";

// WBNB ABI
const WBNB_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
];

async function approveWBNB() {
  // 从环境变量获取私钥
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("错误: 请在 .env 文件中设置 PRIVATE_KEY");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC);
  const wallet = new ethers.Wallet(privateKey, provider);
  const wbnb = new ethers.Contract(WBNB_ADDRESS, WBNB_ABI, wallet);

  console.log("=== WBNB 授权到 SharedBridge ===\n");
  console.log("用户地址:", wallet.address);
  console.log("WBNB 地址:", WBNB_ADDRESS);
  console.log("SharedBridge:", SHARED_BRIDGE);
  console.log("");

  // 检查当前余额
  const balance = await wbnb.balanceOf(wallet.address);
  console.log("WBNB 余额:", ethers.formatEther(balance), "WBNB");

  // 检查当前授权
  const currentAllowance = await wbnb.allowance(wallet.address, SHARED_BRIDGE);
  console.log("当前授权:", ethers.formatEther(currentAllowance), "WBNB");
  console.log("");

  // 授权最大值
  const maxAmount = ethers.MaxUint256;
  console.log("正在授权最大值到 SharedBridge...");

  try {
    const tx = await wbnb.approve(SHARED_BRIDGE, maxAmount, {
      gasLimit: 100000,
    });

    console.log("交易已发送:", tx.hash);
    console.log("等待确认...");

    const receipt = await tx.wait();
    console.log("✓ 授权成功！");
    console.log("区块:", receipt.blockNumber);
    console.log("Gas 使用:", receipt.gasUsed.toString());
    console.log("");

    // 验证授权
    const newAllowance = await wbnb.allowance(wallet.address, SHARED_BRIDGE);
    console.log("新的授权额度:", ethers.formatEther(newAllowance), "WBNB");
    console.log("");
    console.log("现在可以进行 WBNB 跨链了！");
  } catch (error) {
    console.error("授权失败:", error.message);
    if (error.data) {
      console.error("错误数据:", error.data);
    }
  }
}

approveWBNB().catch(console.error);
