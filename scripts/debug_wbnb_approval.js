const { ethers } = require("ethers");

// 配置
const BSC_TESTNET_RPC = "https://bsc-testnet.bnbchain.org";
const WBNB_ADDRESS = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";
const SHARED_BRIDGE = "0xC3A77C9FEF8f14F1f39760Cc2376F1eb8d60bE4A";
const BRIDGEHUB = "0xf07b8aa29e38d6014db87497ddc8b7e3a1cf465d";

// 你的钱包地址 (从命令行参数获取)
const USER_ADDRESS = process.argv[2];

if (!USER_ADDRESS) {
  console.error("Usage: node debug_wbnb_approval.js <YOUR_WALLET_ADDRESS>");
  process.exit(1);
}

const WBNB_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

async function checkApproval() {
  const provider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC);
  const wbnb = new ethers.Contract(WBNB_ADDRESS, WBNB_ABI, provider);

  console.log("=== WBNB Approval Debug ===");
  console.log("User Address:", USER_ADDRESS);
  console.log("WBNB Address:", WBNB_ADDRESS);
  console.log("SharedBridge:", SHARED_BRIDGE);
  console.log("Bridgehub:", BRIDGEHUB);
  console.log("");

  // 检查 WBNB 余额
  const balance = await wbnb.balanceOf(USER_ADDRESS);
  console.log("WBNB Balance:", ethers.formatEther(balance), "WBNB");

  // 检查对 SharedBridge 的授权
  const allowanceShared = await wbnb.allowance(USER_ADDRESS, SHARED_BRIDGE);
  console.log("Allowance to SharedBridge:", ethers.formatEther(allowanceShared), "WBNB");

  // 检查对 Bridgehub 的授权 (不应该需要,但检查一下)
  const allowanceBridgehub = await wbnb.allowance(USER_ADDRESS, BRIDGEHUB);
  console.log("Allowance to Bridgehub:", ethers.formatEther(allowanceBridgehub), "WBNB");

  console.log("");
  console.log("=== Analysis ===");
  if (allowanceShared > 0n) {
    console.log("✓ SharedBridge approval exists");
  } else {
    console.log("✗ SharedBridge approval is ZERO - need to approve!");
  }

  if (balance === 0n) {
    console.log("✗ WBNB balance is ZERO - need to wrap BNB first!");
  } else {
    console.log("✓ WBNB balance exists");
  }
}

checkApproval().catch(console.error);
