const { ethers } = require("ethers");

const BSC_TESTNET_RPC = "https://bsc-testnet.bnbchain.org";
const USER_ADDRESS = "0x7CB5c1C44f7729a34F07Bb67603d65D81a8cD16a";

// 合约地址
const WBNB_ADDRESS = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";
const TMAI_ADDRESS = "0xc42f240c256f5fb97346b9d69d10e2e1d77b2eba"; // Base Token
const SHARED_BRIDGE = "0xc3a77c9fef8f14f1f39760cc2376f1eb8d60be4a";
const BRIDGEHUB = "0xf07b8aa29e38d6014db87497ddc8b7e3a1cf465d";

const ERC20_ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
];

async function main() {
  const provider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC);

  console.log("=== 检查所有授权 ===\n");
  console.log("用户:", USER_ADDRESS);
  console.log("");

  // 检查 WBNB
  const wbnb = new ethers.Contract(WBNB_ADDRESS, ERC20_ABI, provider);
  const wbnbBalance = await wbnb.balanceOf(USER_ADDRESS);
  const wbnbToShared = await wbnb.allowance(USER_ADDRESS, SHARED_BRIDGE);
  const wbnbToBridgehub = await wbnb.allowance(USER_ADDRESS, BRIDGEHUB);

  console.log("WBNB:");
  console.log("  余额:", ethers.formatEther(wbnbBalance));
  console.log("  对 SharedBridge 授权:", ethers.formatEther(wbnbToShared));
  console.log("  对 Bridgehub 授权:", ethers.formatEther(wbnbToBridgehub));
  console.log("");

  // 检查 tMai (Base Token)
  const tmai = new ethers.Contract(TMAI_ADDRESS, ERC20_ABI, provider);
  const tmaiBalance = await tmai.balanceOf(USER_ADDRESS);
  const tmaiToShared = await tmai.allowance(USER_ADDRESS, SHARED_BRIDGE);
  const tmaiToBridgehub = await tmai.allowance(USER_ADDRESS, BRIDGEHUB);

  console.log("tMai (Base Token):");
  console.log("  余额:", ethers.formatEther(tmaiBalance));
  console.log("  对 SharedBridge 授权:", ethers.formatEther(tmaiToShared));
  console.log("  对 Bridgehub 授权:", ethers.formatEther(tmaiToBridgehub));
  console.log("");

  console.log("=== 分析 ===");
  
  if (wbnbToShared < ethers.parseEther("0.03")) {
    console.log("✗ WBNB 对 SharedBridge 授权不足");
  } else {
    console.log("✓ WBNB 对 SharedBridge 授权充足");
  }

  if (tmaiToBridgehub < ethers.parseEther("0.001")) {
    console.log("✗ tMai 对 Bridgehub 授权不足 - 这可能是问题所在！");
    console.log("  Bridgehub 需要 tMai 授权来支付 L2 gas");
  } else {
    console.log("✓ tMai 对 Bridgehub 授权充足");
  }
}

main().catch(console.error);
