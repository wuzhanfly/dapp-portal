/**
 * 解码 WBNB 跨链交易 - 查看 SDK 生成的完整交易数据
 */

const { Provider, Wallet } = require("zksync-ethers");
const { ethers } = require("ethers");

const L1_RPC_URL = "http://13.212.114.138:10575";
const L2_RPC_URL = "http://54.255.184.251:3050";
const PRIVATE_KEY = "0xc9fd9d8eedf1d07a3ff46bd7370c48db3b4c359f4d0dfd73404c3a27f687dae1";
const WBNB_ADDRESS = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";

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
  console.log("  解码 WBNB 跨链交易");
  console.log("===========================================\n");

  const l1Provider = new BSCProvider(L1_RPC_URL);
  const l2Provider = new Provider(L2_RPC_URL);
  
  const l1Wallet = new ethers.Wallet(PRIVATE_KEY, l1Provider);
  const l2Wallet = new Wallet(PRIVATE_KEY, l2Provider, l1Provider);
  
  const address = l1Wallet.address;
  console.log(`地址: ${address}\n`);

  // 获取 deposit 交易详情
  console.log("步骤 1: 获取 deposit 交易详情");
  try {
    const amountToDeposit = ethers.parseEther("0.001");
    
    const depositTx = await l2Wallet.getDepositTx({
      token: WBNB_ADDRESS,
      amount: amountToDeposit,
    });
    
    console.log(`  目标合约: ${depositTx.to}`);
    console.log(`  msg.value: ${depositTx.value}`);
    console.log(`  调用数据长度: ${depositTx.data.length} bytes`);
    console.log(`  调用数据: ${depositTx.data}\n`);
    
    // 解码函数选择器
    const selector = depositTx.data.substring(0, 10);
    console.log(`  函数选择器: ${selector}`);
    
    // 尝试解码参数
    const bridgehubAbi = [
      "function requestL2TransactionTwoBridges((uint256 chainId, uint256 mintValue, uint256 l2Value, uint256 l2GasLimit, uint256 l2GasPerPubdataByteLimit, address refundRecipient, address secondBridgeAddress, uint256 secondBridgeValue, bytes secondBridgeCalldata) _request) returns (bytes32)",
    ];
    
    const iface = new ethers.Interface(bridgehubAbi);
    
    try {
      const decoded = iface.parseTransaction({ data: depositTx.data });
      console.log(`  函数名: ${decoded.name}`);
      console.log(`  参数:\n`);
      
      const request = decoded.args[0];
      console.log(`    chainId: ${request.chainId}`);
      console.log(`    mintValue: ${request.mintValue}`);
      console.log(`    l2Value: ${request.l2Value}`);
      console.log(`    l2GasLimit: ${request.l2GasLimit}`);
      console.log(`    l2GasPerPubdataByteLimit: ${request.l2GasPerPubdataByteLimit}`);
      console.log(`    refundRecipient: ${request.refundRecipient}`);
      console.log(`    secondBridgeAddress: ${request.secondBridgeAddress}`);
      console.log(`    secondBridgeValue: ${request.secondBridgeValue}`);
      console.log(`    secondBridgeCalldata: ${request.secondBridgeCalldata}`);
      console.log(`    secondBridgeCalldata 长度: ${request.secondBridgeCalldata.length} bytes\n`);
      
      // 如果 secondBridgeCalldata 不是 0x，尝试解码它
      if (request.secondBridgeCalldata !== "0x") {
        console.log(`  解码 secondBridgeCalldata:`);
        const calldataSelector = request.secondBridgeCalldata.substring(0, 10);
        console.log(`    函数选择器: ${calldataSelector}\n`);
      }
    } catch (error) {
      console.error(`  ❌ 解码失败: ${error.message}\n`);
    }
    
  } catch (error) {
    console.error(`  ❌ 获取交易失败: ${error.message}\n`);
  }

  console.log("===========================================");
  console.log("  完成！");
  console.log("===========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
