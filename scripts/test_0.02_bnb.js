/**
 * 测试 0.02 BNB 跨链
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
  console.log("  测试 0.02 BNB 跨链");
  console.log("===========================================\n");

  const l1Provider = new BSCProvider(L1_RPC_URL);
  const l2Provider = new Provider(L2_RPC_URL);
  
  const l1Wallet = new ethers.Wallet(PRIVATE_KEY, l1Provider);
  const l2Wallet = new Wallet(PRIVATE_KEY, l2Provider, l1Provider);
  
  const address = l1Wallet.address;
  console.log(`地址: ${address}\n`);

  // 跨链 0.02 BNB
  const amountToDeposit = ethers.parseEther("0.02");
  console.log(`跨链金额: ${ethers.formatEther(amountToDeposit)} WBNB\n`);
  
  try {
    console.log("⏳ 发送跨链交易...");
    const depositHandle = await l2Wallet.deposit({
      token: WBNB_ADDRESS,
      amount: amountToDeposit,
      approveERC20: true,
      approveBaseERC20: true,
      approveOverrides: {
        type: 0,
        gasPrice: ethers.parseUnits("3", "gwei"),
        gasLimit: 100000,
      },
      overrides: {
        type: 0,
        gasPrice: ethers.parseUnits("3", "gwei"),
      },
    });
    
    console.log(`✅ 跨链交易已发送: ${depositHandle.hash}`);
    const l1Receipt = await depositHandle.waitL1Commit();
    console.log(`✅ L1 交易已确认 (区块 ${l1Receipt?.blockNumber || 'unknown'})\n`);
    
  } catch (error) {
    console.error(`❌ 跨链失败: ${error.message}\n`);
    if (error.data) {
      console.error(`错误数据: ${error.data}`);
    }
    throw error;
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
