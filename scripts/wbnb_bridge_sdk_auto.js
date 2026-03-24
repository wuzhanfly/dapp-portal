/**
 * WBNB 跨链 - 使用 SDK 自动授权
 * 
 * 让 SDK 自己处理所有授权逻辑
 */

const { Provider, Wallet } = require("zksync-ethers");
const { ethers } = require("ethers");

const L1_RPC_URL = "http://13.212.114.138:10575";
const L2_RPC_URL = "http://54.255.184.251:3050";
const PRIVATE_KEY = "0xc9fd9d8eedf1d07a3ff46bd7370c48db3b4c359f4d0dfd73404c3a27f687dae1";
const WBNB_ADDRESS = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";

const WBNB_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

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
  console.log("  WBNB 跨链 - SDK 自动授权");
  console.log("===========================================\n");

  const l1Provider = new BSCProvider(L1_RPC_URL);
  const l2Provider = new Provider(L2_RPC_URL);
  
  const l1Wallet = new ethers.Wallet(PRIVATE_KEY, l1Provider);
  const l2Wallet = new Wallet(PRIVATE_KEY, l2Provider, l1Provider);
  
  const address = l1Wallet.address;
  console.log(`地址: ${address}\n`);

  // 1. 检查 WBNB 余额
  console.log("步骤 1: 检查 WBNB 余额");
  const wbnbContract = new ethers.Contract(WBNB_ADDRESS, WBNB_ABI, l1Provider);
  const wbnbBalance = await wbnbContract.balanceOf(address);
  console.log(`  WBNB 余额: ${ethers.formatEther(wbnbBalance)} WBNB\n`);

  if (wbnbBalance === 0n) {
    console.log("⚠️  WBNB 余额为 0\n");
    return;
  }

  // 2. 检查 L2 余额（跨链前）
  console.log("步骤 2: 检查 L2 余额（跨链前）");
  try {
    const l2WbnbAddress = await l2Provider.l2TokenAddress(WBNB_ADDRESS);
    console.log(`  L2 WBNB Token: ${l2WbnbAddress}`);
    
    const l2WbnbContract = new ethers.Contract(
      l2WbnbAddress,
      ["function balanceOf(address) view returns (uint256)"],
      l2Provider
    );
    
    const l2BalanceBefore = await l2WbnbContract.balanceOf(address);
    console.log(`  L2 WBNB 余额: ${ethers.formatEther(l2BalanceBefore)} WBNB\n`);
  } catch (error) {
    console.log(`  L2 WBNB Token 还未部署\n`);
  }

  // 3. 跨链（让 SDK 自动处理授权）
  const amountToDeposit = ethers.parseEther("0.01");
  console.log("步骤 3: 跨链 WBNB 到 L2");
  console.log(`  跨链金额: ${ethers.formatEther(amountToDeposit)} WBNB`);
  console.log(`  ⏳ SDK 将自动处理授权...\n`);
  
  try {
    const depositHandle = await l2Wallet.deposit({
      token: WBNB_ADDRESS,
      amount: amountToDeposit,
      approveERC20: true, // 让 SDK 自动授权
      approveBaseERC20: true, // 也授权 base token（如果需要）
      // 授权交易的 overrides
      approveOverrides: {
        type: 0,
        gasPrice: ethers.parseUnits("3", "gwei"),
        gasLimit: 100000,
      },
      // 存款交易的 overrides
      overrides: {
        type: 0,
        gasPrice: ethers.parseUnits("3", "gwei"),
      },
    });
    
    console.log(`  ✅ 跨链交易已发送: ${depositHandle.hash}`);
    const l1Receipt = await depositHandle.waitL1Commit();
    console.log(`  ✅ L1 交易已确认 (区块 ${l1Receipt?.blockNumber || 'unknown'})`);
    console.log(`  ⏳ 等待 L2 交易完成...\n`);
    
  } catch (error) {
    console.error(`  ❌ 跨链失败: ${error.message}\n`);
    
    // 详细错误信息
    if (error.message.includes("insufficient allowance")) {
      console.log(`  ⚠️  授权问题`);
      console.log(`  SDK 的自动授权可能没有授权给正确的合约\n`);
      
      // 尝试手动查看需要授权给哪个合约
      console.log(`  让我们尝试手动调用 Bridgehub 看看需要什么...\n`);
    }
    
    throw error;
  }

  // 4. 等待并检查 L2 余额
  console.log("步骤 4: 等待 30 秒后检查 L2 余额...");
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  try {
    const l2WbnbAddress = await l2Provider.l2TokenAddress(WBNB_ADDRESS);
    const l2WbnbContract = new ethers.Contract(
      l2WbnbAddress,
      ["function balanceOf(address) view returns (uint256)"],
      l2Provider
    );
    
    const l2Balance = await l2WbnbContract.balanceOf(address);
    console.log(`  L2 WBNB 余额: ${ethers.formatEther(l2Balance)} WBNB`);
    
    if (l2Balance > 0n) {
      console.log(`  ✅ 跨链成功！\n`);
    } else {
      console.log(`  ⏳ 还在处理中，请稍后再查询\n`);
    }
    
  } catch (error) {
    console.error(`  ❌ 查询失败: ${error.message}\n`);
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
