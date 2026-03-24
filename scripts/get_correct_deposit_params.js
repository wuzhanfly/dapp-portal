/**
 * 获取正确的 deposit 参数
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
  console.log("  获取正确的 Deposit 参数");
  console.log("===========================================\n");

  const l1Provider = new BSCProvider(L1_RPC_URL);
  const l2Provider = new Provider(L2_RPC_URL);
  
  const l1Wallet = new ethers.Wallet(PRIVATE_KEY, l1Provider);
  const l2Wallet = new Wallet(PRIVATE_KEY, l2Provider, l1Provider);
  
  const address = l1Wallet.address;
  console.log(`地址: ${address}\n`);

  // 获取 deposit 交易详情
  console.log("获取 0.02 BNB 的 deposit 参数:");
  try {
    const amountToDeposit = ethers.parseEther("0.02");
    
    const depositTx = await l2Wallet.getDepositTx({
      token: WBNB_ADDRESS,
      amount: amountToDeposit,
    });
    
    console.log(`  目标合约: ${depositTx.to}`);
    console.log(`  msg.value: ${depositTx.value}`);
    
    // 解码参数
    const bridgehubAbi = [
      "function requestL2TransactionTwoBridges((uint256 chainId, uint256 mintValue, uint256 l2Value, uint256 l2GasLimit, uint256 l2GasPerPubdataByteLimit, address refundRecipient, address secondBridgeAddress, uint256 secondBridgeValue, bytes secondBridgeCalldata) _request) returns (bytes32)",
    ];
    
    const iface = new ethers.Interface(bridgehubAbi);
    const decoded = iface.parseTransaction({ data: depositTx.data });
    
    const request = decoded.args[0];
    console.log(`\n  参数:`);
    console.log(`    chainId: ${request.chainId}`);
    console.log(`    mintValue: ${request.mintValue} (${ethers.formatEther(request.mintValue)} tMai)`);
    console.log(`    l2Value: ${request.l2Value}`);
    console.log(`    l2GasLimit: ${request.l2GasLimit}`);
    console.log(`    l2GasPerPubdataByteLimit: ${request.l2GasPerPubdataByteLimit}`);
    console.log(`    refundRecipient: ${request.refundRecipient}`);
    console.log(`    secondBridgeAddress: ${request.secondBridgeAddress}`);
    console.log(`    secondBridgeValue: ${request.secondBridgeValue}`);
    console.log(`    secondBridgeCalldata 长度: ${request.secondBridgeCalldata.length} bytes\n`);
    
    // 获取 gas price
    const gasPrice = depositTx.gasPrice || ethers.parseUnits("3", "gwei");
    console.log(`  Gas Price: ${gasPrice} (${ethers.formatUnits(gasPrice, "gwei")} gwei)`);
    
    // 计算 baseCost
    const bridgehub = await l2Wallet.getBridgehubContract();
    const chainId = (await l2Provider.getNetwork()).chainId;
    const baseCost = await bridgehub.l2TransactionBaseCost(
      chainId,
      gasPrice,
      request.l2GasLimit,
      request.l2GasPerPubdataByteLimit
    );
    console.log(`  Base Cost: ${baseCost} (${ethers.formatEther(baseCost)} tMai)`);
    console.log(`  Operator Tip: ${request.mintValue - baseCost} (${ethers.formatEther(request.mintValue - baseCost)} tMai)\n`);
    
  } catch (error) {
    console.error(`  ❌ 获取交易失败: ${error.message}\n`);
    console.error(error);
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
