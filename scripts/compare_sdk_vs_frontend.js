const { ethers } = require("ethers");

// SDK 成功的交易
const SDK_TX = "0xae5ec9f3c21a9f7aaea70d57fe42f5a54cf5efdf2a042e68c5268cceba91ccd3";

// 前端失败的 calldata
const FRONTEND_CALLDATA = "0x24fd57fb000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000025f8000000000000000000000000000000000000000000000000000090bfa6daa4200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008647000000000000000000000000000000000000000000000000000000000000003200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c3a77c9fef8f14f1f39760cc2376f1eb8d60be4a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000000c101ddaf0a252cd1f313d164bdfededc82da13c72478c33bac7ddad2649434ced2c000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000006a94d74f4300000000000000000000000000007cb5c1c44f7729a34f07bb67603d65d81a8cd16a000000000000000000000000ae13d989dac2f0debff460ac112a837c89baa7cd";

const BRIDGEHUB_ABI = [
  "function requestL2TransactionTwoBridges((uint256 chainId, uint256 mintValue, uint256 l2Value, uint256 l2GasLimit, uint256 l2GasPerPubdataByteLimit, address refundRecipient, address secondBridgeAddress, uint256 secondBridgeValue, bytes secondBridgeCalldata))",
];

async function main() {
  console.log("=== 对比 SDK vs 前端调用 ===\n");

  // 解码前端 calldata
  const iface = new ethers.Interface(BRIDGEHUB_ABI);
  const decoded = iface.parseTransaction({ data: FRONTEND_CALLDATA });

  console.log("前端调用参数:");
  console.log("  chainId:", decoded.args[0].chainId.toString());
  console.log("  mintValue:", ethers.formatEther(decoded.args[0].mintValue), "BNB");
  console.log("  l2Value:", decoded.args[0].l2Value.toString());
  console.log("  l2GasLimit:", decoded.args[0].l2GasLimit.toString());
  console.log("  l2GasPerPubdataByteLimit:", decoded.args[0].l2GasPerPubdataByteLimit.toString());
  console.log("  refundRecipient:", decoded.args[0].refundRecipient);
  console.log("  secondBridgeAddress:", decoded.args[0].secondBridgeAddress);
  console.log("  secondBridgeValue:", decoded.args[0].secondBridgeValue.toString());
  console.log("  secondBridgeCalldata:", decoded.args[0].secondBridgeCalldata);
  console.log("");

  // 获取 SDK 交易
  console.log("正在获取 SDK 交易数据...");
  const provider = new ethers.JsonRpcProvider("https://bsc-testnet.bnbchain.org");
  
  try {
    const tx = await provider.getTransaction(SDK_TX);
    if (!tx) {
      console.log("交易未找到");
      return;
    }

    console.log("\nSDK 交易:");
    console.log("  from:", tx.from);
    console.log("  to:", tx.to);
    console.log("  value:", ethers.formatEther(tx.value), "BNB");
    console.log("  data length:", tx.data.length);
    console.log("");

    // 解码 SDK calldata
    const sdkDecoded = iface.parseTransaction({ data: tx.data });
    console.log("SDK 调用参数:");
    console.log("  chainId:", sdkDecoded.args[0].chainId.toString());
    console.log("  mintValue:", ethers.formatEther(sdkDecoded.args[0].mintValue), "BNB");
    console.log("  l2Value:", sdkDecoded.args[0].l2Value.toString());
    console.log("  l2GasLimit:", sdkDecoded.args[0].l2GasLimit.toString());
    console.log("  l2GasPerPubdataByteLimit:", sdkDecoded.args[0].l2GasPerPubdataByteLimit.toString());
    console.log("  refundRecipient:", sdkDecoded.args[0].refundRecipient);
    console.log("  secondBridgeAddress:", sdkDecoded.args[0].secondBridgeAddress);
    console.log("  secondBridgeValue:", sdkDecoded.args[0].secondBridgeValue.toString());
    console.log("  secondBridgeCalldata:", sdkDecoded.args[0].secondBridgeCalldata);
    console.log("");

    // 对比差异
    console.log("=== 差异对比 ===");
    if (decoded.args[0].chainId !== sdkDecoded.args[0].chainId) {
      console.log("✗ chainId 不同");
    }
    if (decoded.args[0].mintValue !== sdkDecoded.args[0].mintValue) {
      console.log("✗ mintValue 不同");
    }
    if (decoded.args[0].secondBridgeAddress.toLowerCase() !== sdkDecoded.args[0].secondBridgeAddress.toLowerCase()) {
      console.log("✗ secondBridgeAddress 不同");
    }
    if (decoded.args[0].secondBridgeCalldata !== sdkDecoded.args[0].secondBridgeCalldata) {
      console.log("✗ secondBridgeCalldata 不同");
      console.log("  前端长度:", decoded.args[0].secondBridgeCalldata.length);
      console.log("  SDK 长度:", sdkDecoded.args[0].secondBridgeCalldata.length);
    } else {
      console.log("✓ 所有参数相同");
    }

  } catch (error) {
    console.error("获取交易失败:", error.message);
  }
}

main().catch(console.error);
