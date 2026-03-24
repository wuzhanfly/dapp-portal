const { ethers } = require("ethers");

const BSC_TESTNET_RPC = "https://bsc-testnet.bnbchain.org";
const WBNB_ADDRESS = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";
const SHARED_BRIDGE = "0xc3a77c9fef8f14f1f39760cc2376f1eb8d60be4a";
const USER_ADDRESS = "0x7CB5c1C44f7729a34F07Bb67603d65D81a8cD16a";

const WBNB_ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
];

async function checkTransferability() {
  const provider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC);
  const wbnb = new ethers.Contract(WBNB_ADDRESS, WBNB_ABI, provider);

  console.log("=== 检查 SharedBridge 是否能转账 WBNB ===\n");

  const balance = await wbnb.balanceOf(USER_ADDRESS);
  const allowance = await wbnb.allowance(USER_ADDRESS, SHARED_BRIDGE);
  const requiredAmount = ethers.parseEther("0.03");

  console.log("用户 WBNB 余额:", ethers.formatEther(balance), "WBNB");
  console.log("对 SharedBridge 的授权:", ethers.formatEther(allowance), "WBNB");
  console.log("需要转账:", ethers.formatEther(requiredAmount), "WBNB");
  console.log("");

  console.log("=== 检查结果 ===");
  
  if (balance < requiredAmount) {
    console.log("✗ 余额不足");
    return;
  } else {
    console.log("✓ 余额充足");
  }

  if (allowance < requiredAmount) {
    console.log("✗ 授权不足 - 这就是问题所在！");
    console.log("");
    console.log("解决方案：需要增加授权额度");
    console.log("当前授权:", ethers.formatEther(allowance), "WBNB");
    console.log("需要授权:", ethers.formatEther(requiredAmount), "WBNB");
    console.log("建议授权最大值以避免将来再次授权");
  } else {
    console.log("✓ 授权充足");
    console.log("");
    console.log("授权没有问题，错误可能来自其他地方");
  }
}

checkTransferability().catch(console.error);
