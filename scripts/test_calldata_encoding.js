/**
 * 测试我们的 calldata 编码是否与 SDK 一致
 */

const { ethers } = require("ethers");

const WBNB_ADDRESS = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";
const L2_NATIVE_TOKEN_VAULT_ADDRESS = "0x0000000000000000000000000000000000010004";
const L1_CHAIN_ID = 97n; // BSC Testnet
const RECEIVER = "0x7CB5c1C44f7729a34F07Bb67603d65D81a8cD16a";
const AMOUNT = ethers.parseEther("0.001");

console.log("===========================================");
console.log("  测试 Calldata 编码");
console.log("===========================================\n");

// 1. Encode NTV Asset ID
function encodeNTVAssetId(chainId, tokenAddress) {
  const abi = new ethers.AbiCoder();
  const hex = abi.encode(
    ["uint256", "address", "address"],
    [chainId, L2_NATIVE_TOKEN_VAULT_ADDRESS, tokenAddress]
  );
  return ethers.keccak256(hex);
}

// 2. Encode Native Token Vault Transfer Data
function encodeNativeTokenVaultTransferData(amount, receiver, token) {
  const abi = new ethers.AbiCoder();
  return abi.encode(["uint256", "address", "address"], [amount, receiver, token]);
}

// 3. Encode Second Bridge Data V1
function encodeSecondBridgeDataV1(assetId, transferData) {
  const abi = new ethers.AbiCoder();
  const data = abi.encode(["bytes32", "bytes"], [assetId, transferData]);
  return ethers.concat(["0x01", data]);
}

// 生成完整的 calldata
const assetId = encodeNTVAssetId(L1_CHAIN_ID, WBNB_ADDRESS);
console.log(`Asset ID: ${assetId}\n`);

const transferData = encodeNativeTokenVaultTransferData(AMOUNT, RECEIVER, WBNB_ADDRESS);
console.log(`Transfer Data: ${transferData}`);
console.log(`Transfer Data 长度: ${transferData.length} 字符\n`);

const secondBridgeCalldata = encodeSecondBridgeDataV1(assetId, transferData);
console.log(`Second Bridge Calldata: ${secondBridgeCalldata}`);
console.log(`Second Bridge Calldata 长度: ${secondBridgeCalldata.length} 字符\n`);

// 从 SDK 获取的实际 calldata (从之前的调试输出)
const sdkCalldata = "0x01ddaf0a252cd1f313d164bdfededc82da13c72478c33bac7ddad2649434ced2c00000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000038d7ea4c680000000000000000000000000007cb5c1c44f7729a34f07bb67603d65d81a8cd16a000000000000000000000000ae13d989dac2f0debff460ac112a837c89baa7cd";

console.log(`SDK Calldata: ${sdkCalldata}`);
console.log(`SDK Calldata 长度: ${sdkCalldata.length} 字符\n`);

// 比较
if (secondBridgeCalldata.toLowerCase() === sdkCalldata.toLowerCase()) {
  console.log("✅ 编码匹配！我们的实现是正确的。\n");
} else {
  console.log("❌ 编码不匹配。让我们看看差异：\n");
  console.log(`我们的: ${secondBridgeCalldata}`);
  console.log(`SDK的: ${sdkCalldata}\n`);
  
  // 找出第一个不同的位置
  for (let i = 0; i < Math.min(secondBridgeCalldata.length, sdkCalldata.length); i++) {
    if (secondBridgeCalldata[i].toLowerCase() !== sdkCalldata[i].toLowerCase()) {
      console.log(`第一个差异在位置 ${i}: 我们='${secondBridgeCalldata[i]}', SDK='${sdkCalldata[i]}'`);
      break;
    }
  }
}

console.log("===========================================");
console.log("  完成！");
console.log("===========================================");
