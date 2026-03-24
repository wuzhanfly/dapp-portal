/**
 * 解码错误数据
 */

const { ethers } = require("ethers");

const errorData = "0xb385a3da00000000000000000000000000000000000000000000000000008fd05874820000000000000000000000000000000000000000000000000000008a748956b340";

console.log("解码错误数据:\n");
console.log(`完整数据: ${errorData}\n`);

const selector = errorData.substring(0, 10);
console.log(`错误选择器: ${selector}\n`);

// 尝试解码参数
const params = "0x" + errorData.substring(10);
console.log(`参数数据: ${params}\n`);

// 尝试解码为两个 uint256
try {
  const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
    ["uint256", "uint256"],
    params
  );
  console.log("解码为 [uint256, uint256]:");
  console.log(`  参数 1: ${decoded[0]} (${ethers.formatEther(decoded[0])} ETH)`);
  console.log(`  参数 2: ${decoded[1]} (${ethers.formatEther(decoded[1])} ETH)`);
} catch (e) {
  console.log("无法解码为 [uint256, uint256]");
}

// 常见的错误选择器
const commonErrors = {
  "0x08c379a0": "Error(string)",
  "0x4e487b71": "Panic(uint256)",
  "0xb385a3da": "MsgValueTooLow(uint256 expected, uint256 actual)", // 猜测
  "0x95b66fe9": "InsufficientAllowance()",
};

if (commonErrors[selector]) {
  console.log(`\n可能的错误: ${commonErrors[selector]}`);
}

console.log("\n如果是 MsgValueTooLow:");
console.log(`  期望的 msg.value: ${ethers.formatEther("0x00008fd058748200")} ETH`);
console.log(`  实际的 msg.value: ${ethers.formatEther("0x00008a748956b340")} ETH`);
