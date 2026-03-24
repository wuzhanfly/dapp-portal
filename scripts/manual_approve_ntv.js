const { ethers } = require("ethers");

const BSC_TESTNET_RPC = "https://bsc-testnet.bnbchain.org";
const WBNB_ADDRESS = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";
const NATIVE_TOKEN_VAULT = "0xa37b3cf61ed8b3e6740271e7a517fecc15920781";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error("Please set PRIVATE_KEY environment variable");
  console.error("Usage: PRIVATE_KEY=your_private_key node scripts/manual_approve_ntv.js");
  process.exit(1);
}

const WBNB_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

async function approveWBNB() {
  const provider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const wbnb = new ethers.Contract(WBNB_ADDRESS, WBNB_ABI, wallet);

  console.log("=== Approving WBNB to NativeTokenVault ===");
  console.log("User Address:", wallet.address);
  console.log("WBNB Address:", WBNB_ADDRESS);
  console.log("NativeTokenVault:", NATIVE_TOKEN_VAULT);
  console.log("");

  // 检查当前授权
  const currentAllowance = await wbnb.allowance(wallet.address, NATIVE_TOKEN_VAULT);
  console.log("Current Allowance:", ethers.formatEther(currentAllowance), "WBNB");
  console.log("");

  // 授权最大金额
  const maxAmount = ethers.MaxUint256;
  console.log("Approving max amount to NativeTokenVault...");
  
  const tx = await wbnb.approve(NATIVE_TOKEN_VAULT, maxAmount, {
    gasLimit: 100000,
  });
  
  console.log("Transaction sent:", tx.hash);
  console.log("Waiting for confirmation...");
  
  const receipt = await tx.wait();
  console.log("✓ Transaction confirmed in block:", receipt.blockNumber);
  console.log("");

  // 验证授权
  const newAllowance = await wbnb.allowance(wallet.address, NATIVE_TOKEN_VAULT);
  console.log("New Allowance:", ethers.formatEther(newAllowance), "WBNB");
  console.log("");
  console.log("✓ Approval successful! You can now deposit WBNB.");
}

approveWBNB().catch(console.error);
