/**
 * 检查 SDK 授权给了谁
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
  console.log("  检查 SDK 授权给了谁");
  console.log("===========================================\n");

  const l1Provider = new BSCProvider(L1_RPC_URL);
  const l2Provider = new Provider(L2_RPC_URL);
  
  const l1Wallet = new ethers.Wallet(PRIVATE_KEY, l1Provider);
  const l2Wallet = new Wallet(PRIVATE_KEY, l2Provider, l1Provider);
  
  const address = l1Wallet.address;
  console.log(`地址: ${address}\n`);

  // 获取桥接合约地址
  console.log("步骤 1: 获取桥接合约地址");
  const bridgehubAddress = await l2Provider.getBridgehubContractAddress();
  const bridgeAddresses = await l2Provider.getDefaultBridgeAddresses();
  
  console.log(`  Bridgehub: ${bridgehubAddress}`);
  console.log(`  Shared Bridge (L1): ${bridgeAddresses.sharedL1}`);
  console.log(`  ERC20 Bridge (L1): ${bridgeAddresses.erc20L1}\n`);

  // 获取 deposit 交易
  console.log("步骤 2: 获取 SDK 的 deposit 交易");
  const amountToDeposit = ethers.parseEther("0.001");
  
  const depositTx = await l2Wallet.getDepositTx({
    token: WBNB_ADDRESS,
    amount: amountToDeposit,
  });
  
  console.log(`  目标合约: ${depositTx.to}`);
  console.log(`  这是 Bridgehub 吗? ${depositTx.to.toLowerCase() === bridgehubAddress.toLowerCase()}\n`);

  // 检查 SDK 会授权给谁
  console.log("步骤 3: SDK 的 approveERC20 会授权给谁?");
  
  // 从 SDK 源码我们知道，对于 Base Token 链的 ERC20 deposit：
  // SDK 会授权给 SharedBridge (不是 Bridgehub)
  console.log(`  SDK 会授权 WBNB 给: ${bridgeAddresses.sharedL1}`);
  console.log(`  这是 SharedBridge\n`);

  // 验证当前授权
  console.log("步骤 4: 检查当前授权状态");
  const wbnbContract = new ethers.Contract(
    WBNB_ADDRESS,
    ["function allowance(address owner, address spender) view returns (uint256)"],
    l1Provider
  );
  
  const allowanceShared = await wbnbContract.allowance(address, bridgeAddresses.sharedL1);
  const allowanceBridgehub = await wbnbContract.allowance(address, bridgehubAddress);
  
  console.log(`  WBNB 授权给 SharedBridge: ${ethers.formatEther(allowanceShared)} WBNB`);
  console.log(`  WBNB 授权给 Bridgehub: ${ethers.formatEther(allowanceBridgehub)} WBNB\n`);

  console.log("===========================================");
  console.log("  结论");
  console.log("===========================================\n");
  console.log("对于 Base Token 链的 WBNB 跨链:");
  console.log(`  1. 调用 Bridgehub.requestL2TransactionTwoBridges()`);
  console.log(`  2. 但 WBNB 需要授权给 SharedBridge (${bridgeAddresses.sharedL1})`);
  console.log(`  3. 因为 Bridgehub 会调用 SharedBridge 来处理 ERC20 转账\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
