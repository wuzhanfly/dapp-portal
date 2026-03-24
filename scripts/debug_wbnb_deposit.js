/**
 * 调试 WBNB 跨链 - 查看 SDK 实际调用的合约和方法
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
  console.log("  调试 WBNB 跨链");
  console.log("===========================================\n");

  const l1Provider = new BSCProvider(L1_RPC_URL);
  const l2Provider = new Provider(L2_RPC_URL);
  
  const l1Wallet = new ethers.Wallet(PRIVATE_KEY, l1Provider);
  const l2Wallet = new Wallet(PRIVATE_KEY, l2Provider, l1Provider);
  
  const address = l1Wallet.address;
  console.log(`地址: ${address}\n`);

  // 获取桥接合约地址
  console.log("步骤 1: 获取桥接合约信息");
  
  try {
    // 获取 Bridgehub 地址
    const bridgehubAddress = await l2Provider.getBridgehubContractAddress();
    console.log(`  Bridgehub: ${bridgehubAddress}`);
    
    // 获取 L1 Shared Bridge 地址
    const sharedBridgeAddress = await l2Provider.getDefaultBridgeAddresses();
    console.log(`  Shared Bridge (L1): ${sharedBridgeAddress.sharedL1}`);
    console.log(`  ERC20 Bridge (L1): ${sharedBridgeAddress.erc20L1}`);
    
    // 获取 L2 WBNB 地址
    const l2WbnbAddress = await l2Provider.l2TokenAddress(WBNB_ADDRESS);
    console.log(`  L2 WBNB Token: ${l2WbnbAddress}\n`);
  } catch (error) {
    console.error(`  ❌ 获取合约地址失败: ${error.message}\n`);
  }

  // 检查 WBNB 授权情况
  console.log("步骤 2: 检查 WBNB 授权");
  const wbnbContract = new ethers.Contract(
    WBNB_ADDRESS,
    ["function allowance(address owner, address spender) view returns (uint256)"],
    l1Provider
  );
  
  try {
    const bridgehubAddress = await l2Provider.getBridgehubContractAddress();
    const sharedBridgeAddresses = await l2Provider.getDefaultBridgeAddresses();
    
    const allowanceBridgehub = await wbnbContract.allowance(address, bridgehubAddress);
    const allowanceSharedBridge = await wbnbContract.allowance(address, sharedBridgeAddresses.sharedL1);
    const allowanceErc20Bridge = await wbnbContract.allowance(address, sharedBridgeAddresses.erc20L1);
    
    console.log(`  授权给 Bridgehub: ${ethers.formatEther(allowanceBridgehub)} WBNB`);
    console.log(`  授权给 Shared Bridge: ${ethers.formatEther(allowanceSharedBridge)} WBNB`);
    console.log(`  授权给 ERC20 Bridge: ${ethers.formatEther(allowanceErc20Bridge)} WBNB\n`);
  } catch (error) {
    console.error(`  ❌ 检查授权失败: ${error.message}\n`);
  }

  // 尝试获取 deposit 交易的详细信息
  console.log("步骤 3: 模拟 deposit 调用（不实际发送）");
  try {
    const amountToDeposit = ethers.parseEther("0.001");
    
    // 使用 SDK 的 getDepositTx 方法获取交易详情（如果存在）
    if (typeof l2Wallet.getDepositTx === 'function') {
      const depositTx = await l2Wallet.getDepositTx({
        token: WBNB_ADDRESS,
        amount: amountToDeposit,
      });
      
      console.log(`  目标合约: ${depositTx.to}`);
      console.log(`  调用数据: ${depositTx.data.substring(0, 10)}...`);
      console.log(`  msg.value: ${depositTx.value}\n`);
    } else {
      console.log(`  ⚠️  SDK 没有 getDepositTx 方法\n`);
    }
  } catch (error) {
    console.error(`  ❌ 模拟失败: ${error.message}\n`);
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
