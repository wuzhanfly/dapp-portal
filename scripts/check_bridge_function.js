/**
 * 检查 SharedBridge 的函数签名
 */

const { ethers } = require("ethers");

// 可能的函数签名
const possibleFunctions = [
  "bridgehubDeposit(bytes32,address,address,uint256,bytes)",
  "bridgehubDeposit(uint256,address,address,uint256,bytes)",
  "bridgehubDeposit(bytes32,address,uint256,bytes)",
  "deposit(bytes32,address,address,uint256,bytes)",
  "bridgehubDepositBaseToken(uint256,bytes32,address,uint256)",
  "bridgehubDeposit(uint256,bytes32,address,address,uint256,bytes)",
  "bridgehubDeposit(bytes32,uint256,address,address,uint256)",
  "bridgehubDeposit(bytes32,uint256,uint256,address,address)",
  "bridgehubDeposit(bytes32,uint256,uint256,uint256,address,address)",
];

console.log("检查函数选择器:\n");

for (const sig of possibleFunctions) {
  const selector = ethers.id(sig).substring(0, 10);
  console.log(`${sig}`);
  console.log(`  选择器: ${selector}`);
  if (selector === "0x01ddaf0a") {
    console.log(`  ✅ 匹配！\n`);
  } else {
    console.log();
  }
}

// 目标选择器
console.log(`目标选择器: 0x01ddaf0a`);
