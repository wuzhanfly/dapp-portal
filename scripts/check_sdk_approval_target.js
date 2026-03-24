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
  console.log("=== 检查 SDK 授权目标 ===\n");

  const l1Provider = new BSCProvider(L1_RPC_URL);
  const l2Provider = new Provider(L2_RPC_URL);
  const l2Wallet = new Wallet(PRIVATE_KEY, l2Provider, l1Provider);

  // 获取桥接合约地址
  const bridgehubAddress = await l2Provider.getBridgehubContractAddress();
  const sharedBridgeAddress = await l2Provider.getDefaultBridgeAddresses();
  
  console.log("Bridgehub:", bridgehubAddress);
  console.log("SharedBridge:", sharedBridgeAddress.sharedL1);
  console.log("ERC20Bridge:", sharedBridgeAddress.erc20L1);
  console.log("");

  // 获取 L2 token 地址
  const l2TokenAddress = await l2Provider.l2TokenAddress(WBNB_ADDRESS);
  console.log("L2 WBNB Token:", l2TokenAddress);
  console.log("");

  // 检查 SDK 会授权给谁
  console.log("=== SDK deposit 方法会授权给谁？ ===");
  console.log("根据 zksync-ethers SDK 的实现：");
  console.log("1. 对于 Base Token 链，授权给 SharedBridge");
  console.log("2. 对于 ETH 链，授权给 ERC20Bridge");
  console.log("");

  // 检查当前授权
  const WBNB_ABI = [
    "function allowance(address owner, address spender) view returns (uint256)",
  ];
  
  const wbnb = new ethers.Contract(WBNB_ADDRESS, WBNB_ABI, l1Provider);
  const address = l2Wallet.address;

  const allowanceShared = await wbnb.allowance(address, sharedBridgeAddress.sharedL1);
  const allowanceERC20 = sharedBridgeAddress.erc20L1 
    ? await wbnb.allowance(address, sharedBridgeAddress.erc20L1)
    : 0n;

  console.log("=== 当前授权状态 ===");
  console.log(`对 SharedBridge 的授权: ${ethers.formatEther(allowanceShared)} WBNB`);
  console.log(`对 ERC20Bridge 的授权: ${ethers.formatEther(allowanceERC20)} WBNB`);
  console.log("");

  console.log("=== 结论 ===");
  console.log("前端应该授权给:", sharedBridgeAddress.sharedL1);
}

main().catch(console.error);
