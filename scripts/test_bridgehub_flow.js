const { ethers } = require("ethers");

// 配置
const BSC_TESTNET_RPC = "https://bsc-testnet.bnbchain.org";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const WBNB_ADDRESS = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";
const SHARED_BRIDGE = "0xC3A77C9FEF8f14F1f39760Cc2376F1eb8d60bE4A";
const BRIDGEHUB = "0xf07b8aa29e38d6014db87497ddc8b7e3a1cf465d";

if (!PRIVATE_KEY) {
  console.error("Please set PRIVATE_KEY environment variable");
  process.exit(1);
}

const WBNB_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
];

const BRIDGEHUB_ABI = [
  "function sharedBridge() view returns (address)",
];

async function testFlow() {
  const provider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const wbnb = new ethers.Contract(WBNB_ADDRESS, WBNB_ABI, wallet);
  const bridgehub = new ethers.Contract(BRIDGEHUB, BRIDGEHUB_ABI, provider);

  console.log("=== Testing Bridgehub Flow ===");
  console.log("User Address:", wallet.address);
  console.log("");

  // 1. 检查 Bridgehub 的 sharedBridge 地址
  try {
    const sharedBridgeFromHub = await bridgehub.sharedBridge();
    console.log("SharedBridge from Bridgehub:", sharedBridgeFromHub);
    console.log("Expected SharedBridge:", SHARED_BRIDGE);
    console.log("Match:", sharedBridgeFromHub.toLowerCase() === SHARED_BRIDGE.toLowerCase());
  } catch (error) {
    console.log("Could not read sharedBridge from Bridgehub:", error.message);
  }
  console.log("");

  // 2. 检查当前授权
  const balance = await wbnb.balanceOf(wallet.address);
  const allowanceToShared = await wbnb.allowance(wallet.address, SHARED_BRIDGE);
  const allowanceToBridgehub = await wbnb.allowance(wallet.address, BRIDGEHUB);

  console.log("WBNB Balance:", ethers.formatEther(balance));
  console.log("Allowance to SharedBridge:", ethers.formatEther(allowanceToShared));
  console.log("Allowance to Bridgehub:", ethers.formatEther(allowanceToBridgehub));
  console.log("");

  // 3. 分析
  console.log("=== Analysis ===");
  console.log("When calling Bridgehub.requestL2TransactionTwoBridges:");
  console.log("1. Bridgehub receives the call");
  console.log("2. Bridgehub calls SharedBridge to handle ERC20 transfer");
  console.log("3. SharedBridge calls WBNB.transferFrom(user, SharedBridge, amount)");
  console.log("");
  console.log("For this to work, user must approve WBNB to SharedBridge (NOT Bridgehub)");
  console.log("");
  
  if (allowanceToShared >= ethers.parseEther("0.09")) {
    console.log("✓ Current allowance to SharedBridge is sufficient for 0.09 WBNB");
  } else {
    console.log("✗ Current allowance to SharedBridge is NOT sufficient");
    console.log("  Need to approve at least 0.09 WBNB to SharedBridge");
  }
}

testFlow().catch(console.error);
