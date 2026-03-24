const { ethers } = require("ethers");

const BSC_TESTNET_RPC = "https://bsc-testnet.bnbchain.org";
const WBNB_ADDRESS = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";
const SHARED_BRIDGE = "0xC3A77C9FEF8f14F1f39760Cc2376F1eb8d60bE4A";
const USER_ADDRESS = "0x7CB5c1C44f7729a34F07Bb67603d65D81a8cD16a";
const APPROVE_TX = "0x50cc707d7e495a9800585c81689920ecf7f381f9119ddf37994b751526c6146f";

const WBNB_ABI = ["function allowance(address owner, address spender) view returns (uint256)"];

async function main() {
  const provider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC);

  console.log("=== 检查授权交易 ===\n");
  
  // 检查交易
  const tx = await provider.getTransaction(APPROVE_TX);
  if (!tx) {
    console.log("交易未找到");
    return;
  }

  console.log("授权交易:");
  console.log("  from:", tx.from);
  console.log("  to:", tx.to);
  console.log("  blockNumber:", tx.blockNumber);
  console.log("");

  // 检查当前授权
  const wbnb = new ethers.Contract(WBNB_ADDRESS, WBNB_ABI, provider);
  const allowance = await wbnb.allowance(USER_ADDRESS, SHARED_BRIDGE);

  console.log("当前授权:");
  console.log("  数量:", ethers.formatEther(allowance), "WBNB");
  console.log("  原始值:", allowance.toString());
  console.log("");

  if (allowance === ethers.MaxUint256) {
    console.log("✓ 授权成功！已授权最大值");
  } else if (allowance > 0n) {
    console.log("⚠ 授权成功，但不是最大值");
  } else {
    console.log("✗ 授权失败或为 0");
  }
}

main().catch(console.error);
