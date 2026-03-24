const { ethers } = require("ethers");

// 从错误日志中提取的 calldata
const calldata = "0x01ddaf0a252cd1f313d164bdfededc82da13c72478c33bac7ddad2649434ced2c000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000006a94d74f4300000000000000000000000000007cb5c1c44f7729a34f07bb67603d65d81a8cd16a000000000000000000000000ae13d989dac2f0debff460ac112a837c89baa7cd";

console.log("=== 解码 Second Bridge Calldata ===\n");
console.log("原始 calldata:", calldata);
console.log("长度:", calldata.length);
console.log("");

// 解析版本
const version = calldata.slice(0, 4); // 0x01
console.log("版本:", version);

// 解析 assetId (32 bytes)
const assetId = "0x" + calldata.slice(4, 68);
console.log("Asset ID:", assetId);

// 解析剩余数据
const remainingData = "0x" + calldata.slice(68);
console.log("\n剩余数据:", remainingData);

// 解码 transferData
try {
  const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
    ["bytes32", "bytes"],
    "0x" + calldata.slice(4)
  );
  
  console.log("\n=== 解码结果 ===");
  console.log("Asset ID:", decoded[0]);
  console.log("Transfer Data:", decoded[1]);
  
  // 解码 transferData 内容
  const transferDecoded = ethers.AbiCoder.defaultAbiCoder().decode(
    ["uint256", "address", "address"],
    decoded[1]
  );
  
  console.log("\n=== Transfer Data 内容 ===");
  console.log("Amount:", ethers.formatEther(transferDecoded[0]), "WBNB");
  console.log("Amount (wei):", transferDecoded[0].toString());
  console.log("Receiver:", transferDecoded[1]);
  console.log("Token:", transferDecoded[2]);
  
  // 验证
  console.log("\n=== 验证 ===");
  console.log("Token 地址正确:", transferDecoded[2].toLowerCase() === "0xae13d989dac2f0debff460ac112a837c89baa7cd");
  console.log("Receiver 地址正确:", transferDecoded[1].toLowerCase() === "0x7cb5c1c44f7729a34f07bb67603d65d81a8cd16a");
  console.log("Amount 正确:", transferDecoded[0].toString() === "30000000000000000"); // 0.03 WBNB
  
} catch (error) {
  console.error("解码失败:", error.message);
}
