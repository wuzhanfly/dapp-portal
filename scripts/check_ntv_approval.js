const { ethers } = require("ethers");

const BSC_TESTNET_RPC = "https://bsc-testnet.bnbchain.org";
const WBNB_ADDRESS = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";
const SHARED_BRIDGE = "0xC3A77C9FEF8f14F1f39760Cc2376F1eb8d60bE4A";
const NATIVE_TOKEN_VAULT = "0xa37b3cf61ed8b3e6740271e7a517fecc15920781";
const USER_ADDRESS = "0x7CB5c1C44f7729a34F07Bb67603d65D81a8cD16a";

const WBNB_ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
];

async function checkApprovals() {
  const provider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC);
  const wbnb = new ethers.Contract(WBNB_ADDRESS, WBNB_ABI, provider);

  console.log("=== Checking WBNB Approvals ===");
  console.log("User:", USER_ADDRESS);
  console.log("");

  const balance = await wbnb.balanceOf(USER_ADDRESS);
  const allowanceToShared = await wbnb.allowance(USER_ADDRESS, SHARED_BRIDGE);
  const allowanceToNTV = await wbnb.allowance(USER_ADDRESS, NATIVE_TOKEN_VAULT);

  console.log("WBNB Balance:", ethers.formatEther(balance));
  console.log("Allowance to SharedBridge:", ethers.formatEther(allowanceToShared));
  console.log("Allowance to NativeTokenVault:", ethers.formatEther(allowanceToNTV));
  console.log("");

  console.log("=== Analysis ===");
  if (allowanceToNTV >= ethers.parseEther("0.09")) {
    console.log("✓ NativeTokenVault approval is sufficient");
  } else {
    console.log("✗ NativeTokenVault approval is INSUFFICIENT!");
    console.log("  This is likely the problem!");
    console.log("  User needs to approve WBNB to NativeTokenVault, not SharedBridge");
  }
}

checkApprovals().catch(console.error);
