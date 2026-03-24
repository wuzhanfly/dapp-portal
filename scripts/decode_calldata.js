/**
 * 解码 secondBridgeCalldata
 */

const { ethers } = require("ethers");

const calldata = "0x01ddaf0a252cd1f313d164bdfededc82da13c72478c33bac7ddad2649434ced2c00000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000038d7ea4c680000000000000000000000000007cb5c1c44f7729a34f07bb67603d65d81a8cd16a000000000000000000000000ae13d989dac2f0debff460ac112a837c89baa7cd";

console.log("解码 secondBridgeCalldata:\n");
console.log(`完整数据: ${calldata}`);
console.log(`长度: ${calldata.length} 字符 (${(calldata.length - 2) / 2} bytes)\n`);

const selector = calldata.substring(0, 10);
console.log(`函数选择器: ${selector}\n`);

// 移除选择器，剩下的是参数
const params = "0x" + calldata.substring(10);
console.log(`参数数据: ${params}\n`);

// 尝试按 32 字节分段解析
console.log("按 32 字节分段:");
for (let i = 0; i < params.length - 2; i += 64) {
  const chunk = params.substring(2 + i, 2 + i + 64);
  if (chunk.length === 64) {
    console.log(`  [${i / 64}] 0x${chunk}`);
    
    // 尝试解析为不同类型
    try {
      const asNumber = BigInt("0x" + chunk);
      if (asNumber < 1000000000000000000000n) {
        console.log(`      作为数字: ${asNumber}`);
      }
    } catch (e) {}
    
    // 检查是否是地址
    if (chunk.substring(0, 24) === "000000000000000000000000") {
      const addr = "0x" + chunk.substring(24);
      console.log(`      作为地址: ${addr}`);
    }
  }
}

// 尝试一些可能的 ABI
const possibleAbis = [
  ["bytes32", "uint256", "uint256", "uint256", "address", "address"],
  ["bytes32", "address", "address", "uint256", "bytes"],
  ["uint256", "bytes32", "address", "address", "uint256"],
];

console.log("\n尝试解码:");
for (const types of possibleAbis) {
  try {
    const decoded = ethers.AbiCoder.defaultAbiCoder().decode(types, params);
    console.log(`\n  类型: [${types.join(", ")}]`);
    console.log(`  值:`, decoded);
  } catch (e) {
    // 忽略解码失败
  }
}
