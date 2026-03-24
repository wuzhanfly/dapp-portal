const { ethers } = require("ethers");

// 配置
const BSC_TESTNET_RPC = "https://bsc-testnet.bnbchain.org";
const WBNB_ADDRESS = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";
const NATIVE_TOKEN_VAULT = "0xa37b3cf61ed8b3e6740271e7a517fecc15920781";
const SHARED_BRIDGE = "0xc3a77c9fef8f14f1f39760cc2376f1eb8d60be4a";
const USER_ADDRESS = "0x7CB5c1C44f7729a34F07Bb67603d65D81a8cD16a";

// WBNB ABI (只需要 allowance 和 balanceOf)
const WBNB_ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
];

async function checkApprovals() {
  const provider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC);
  const wbnb = new ethers.Contract(WBNB_ADDRESS, WBNB_ABI, provider);

  console.log("=== WBNB 授权检查 ===\n");
  console.log("用户地址:", USER_ADDRESS);
  console.log("WBNB 地址:", WBNB_ADDRESS);
  console.log("NativeTokenVault:", NATIVE_TOKEN_VAULT);
  console.log("SharedBridge:", SHARED_BRIDGE);
  console.log("");

  // 检查 WBNB 余额
  const balance = await wbnb.balanceOf(USER_ADDRESS);
  console.log("WBNB 余额:", ethers.formatEther(balance), "WBNB");
  console.log("");

  // 检查对 NativeTokenVault 的授权
  const allowanceNTV = await wbnb.allowance(USER_ADDRESS, NATIVE_TOKEN_VAULT);
  console.log("对 NativeTokenVault 的授权:");
  console.log("  数量:", ethers.formatEther(allowanceNTV), "WBNB");
  console.log("  原始值:", allowanceNTV.toString());
  console.log("");

  // 检查对 SharedBridge 的授权
  const allowanceSB = await wbnb.allowance(USER_ADDRESS, SHARED_BRIDGE);
  console.log("对 SharedBridge 的授权:");
  console.log("  数量:", ethers.formatEther(allowanceSB), "WBNB");
  console.log("  原始值:", allowanceSB.toString());
  console.log("");

  // 分析
  console.log("=== 分析 ===");
  console.log("✓ 对于 Base Token 链，需要授权给 SharedBridge");
  
  if (allowanceSB > 0n) {
    console.log("✓ SharedBridge 有授权 - 可以跨链");
  } else {
    console.log("✗ SharedBridge 没有授权 - 需要授权！");
  }

  if (allowanceNTV > 0n) {
    console.log("ℹ NativeTokenVault 有授权（不需要，但不影响）");
  }
}

checkApprovals().catch(console.error);
