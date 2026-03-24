/**
 * 检查余额和授权状态
 */

const { Provider, Wallet } = require("zksync-ethers");
const { ethers } = require("ethers");

const L1_RPC_URL = "http://13.212.114.138:10575";
const L2_RPC_URL = "http://54.255.184.251:3050";
const PRIVATE_KEY = "0xc9fd9d8eedf1d07a3ff46bd7370c48db3b4c359f4d0dfd73404c3a27f687dae1";
const WBNB_ADDRESS = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";
const TMAI_ADDRESS = "0xc42f240c256f5fb97346b9d69d10e2e1d77b2eba";
const SHARED_BRIDGE = "0xC3A77C9FEF8f14F1f39760Cc2376F1eb8d60bE4A";
const BRIDGEHUB = "0xf07b8aa29e38d6014db87497ddc8b7e3a1cf465d";

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
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
  console.log("  检查余额和授权状态");
  console.log("===========================================\n");

  const l1Provider = new BSCProvider(L1_RPC_URL);
  const l2Provider = new Provider(L2_RPC_URL);
  
  const l1Wallet = new ethers.Wallet(PRIVATE_KEY, l1Provider);
  const address = l1Wallet.address;
  console.log(`地址: ${address}\n`);

  // 1. 检查 WBNB 余额
  console.log("1. WBNB 余额:");
  const wbnbContract = new ethers.Contract(WBNB_ADDRESS, ERC20_ABI, l1Provider);
  const wbnbBalance = await wbnbContract.balanceOf(address);
  console.log(`   ${ethers.formatEther(wbnbBalance)} WBNB\n`);

  // 2. 检查 tMai 余额
  console.log("2. tMai (Base Token) 余额:");
  const tmaiContract = new ethers.Contract(TMAI_ADDRESS, ERC20_ABI, l1Provider);
  const tmaiBalance = await tmaiContract.balanceOf(address);
  console.log(`   ${ethers.formatEther(tmaiBalance)} tMai`);
  console.log(`   需要: ~0.000152 tMai (mintValue)\n`);

  if (tmaiBalance < ethers.parseEther("0.000152")) {
    console.log("   ⚠️  tMai 余额不足！这可能是问题所在。\n");
  } else {
    console.log("   ✅ tMai 余额充足\n");
  }

  // 3. 检查 WBNB 授权给 SharedBridge
  console.log("3. WBNB 授权给 SharedBridge:");
  const wbnbAllowanceShared = await wbnbContract.allowance(address, SHARED_BRIDGE);
  console.log(`   ${ethers.formatEther(wbnbAllowanceShared)} WBNB`);
  console.log(`   需要: 0.02 WBNB (跨链金额)\n`);

  if (wbnbAllowanceShared < ethers.parseEther("0.02")) {
    console.log("   ⚠️  WBNB 授权不足！需要先授权。\n");
  } else {
    console.log("   ✅ WBNB 授权充足\n");
  }

  // 4. 检查 tMai 授权给 SharedBridge
  console.log("4. tMai 授权给 SharedBridge:");
  const tmaiAllowanceShared = await tmaiContract.allowance(address, SHARED_BRIDGE);
  console.log(`   ${ethers.formatEther(tmaiAllowanceShared)} tMai`);
  console.log(`   需要: ~0.000152 tMai (mintValue)\n`);

  if (tmaiAllowanceShared < ethers.parseEther("0.000152")) {
    console.log("   ⚠️  tMai 授权给 SharedBridge 不足！\n");
  } else {
    console.log("   ✅ tMai 授权给 SharedBridge 充足\n");
  }

  // 5. 检查 tMai 授权给 Bridgehub
  console.log("5. tMai 授权给 Bridgehub:");
  const tmaiAllowanceBridgehub = await tmaiContract.allowance(address, BRIDGEHUB);
  console.log(`   ${ethers.formatEther(tmaiAllowanceBridgehub)} tMai`);
  console.log(`   需要: ~0.000152 tMai (mintValue)\n`);

  if (tmaiAllowanceBridgehub < ethers.parseEther("0.000152")) {
    console.log("   ⚠️  tMai 授权给 Bridgehub 不足！这可能是问题所在。\n");
  } else {
    console.log("   ✅ tMai 授权给 Bridgehub 充足\n");
  }

  console.log("===========================================");
  console.log("  总结");
  console.log("===========================================\n");

  const issues = [];
  if (tmaiBalance < ethers.parseEther("0.000152")) {
    issues.push("- tMai 余额不足");
  }
  if (wbnbAllowanceShared < ethers.parseEther("0.02")) {
    issues.push("- WBNB 未授权给 SharedBridge");
  }
  if (tmaiAllowanceShared < ethers.parseEther("0.000152")) {
    issues.push("- tMai 未授权给 SharedBridge");
  }
  if (tmaiAllowanceBridgehub < ethers.parseEther("0.000152")) {
    issues.push("- tMai 未授权给 Bridgehub (最可能的问题)");
  }

  if (issues.length > 0) {
    console.log("发现以下问题:");
    issues.forEach(issue => console.log(issue));
  } else {
    console.log("✅ 所有检查都通过了！");
  }

  console.log("\n===========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
