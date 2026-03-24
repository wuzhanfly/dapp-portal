const { ethers } = require("ethers");

// 从错误日志中提取的实际调用数据
const CALL_DATA = "0x24fd57fb000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000025f8000000000000000000000000000000000000000000000000000090bfa6daa4200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008647000000000000000000000000000000000000000000000000000000000000003200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c3a77c9fef8f14f1f39760cc2376f1eb8d60be4a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000000c101ddaf0a252cd1f313d164bdfededc82da13c72478c33bac7ddad2649434ced2c000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000013fbe85edc900000000000000000000000000007cb5c1c44f7729a34f07bb67603d65d81a8cd16a000000000000000000000000ae13d989dac2f0debff460ac112a837c89baa7cd00000000000000000000000000000000000000000000000000000000000000";

const BSC_TESTNET_RPC = "https://bsc-testnet.bnbchain.org";
const BRIDGEHUB = "0xf07b8aa29e38d6014db87497ddc8b7e3a1cf465d";
const USER_ADDRESS = "0x7CB5c1C44f7729a34F07Bb67603d65D81a8cD16a";
const WBNB_ADDRESS = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";
const SHARED_BRIDGE = "0xC3A77C9FEF8f14F1f39760Cc2376F1eb8d60bE4A";

const WBNB_ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
];

async function simulateCall() {
  const provider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC);
  const wbnb = new ethers.Contract(WBNB_ADDRESS, WBNB_ABI, provider);

  console.log("=== Simulating WBNB Deposit Call ===");
  console.log("");

  // 检查当前状态
  const balance = await wbnb.balanceOf(USER_ADDRESS);
  const allowance = await wbnb.allowance(USER_ADDRESS, SHARED_BRIDGE);
  
  console.log("User WBNB Balance:", ethers.formatEther(balance));
  console.log("Allowance to SharedBridge:", ethers.formatEther(allowance));
  console.log("");

  // 从 calldata 中解析参数
  console.log("=== Decoded Call Parameters ===");
  console.log("Amount to deposit: 0.09 WBNB (0x13fbe85edc90000)");
  console.log("Receiver: 0x7cb5c1c44f7729a34f07bb67603d65d81a8cd16a");
  console.log("Token: 0xae13d989dac2f0debff460ac112a837c89baa7cd (WBNB)");
  console.log("");

  // 尝试估算 gas
  console.log("=== Attempting Gas Estimation ===");
  try {
    const gasEstimate = await provider.estimateGas({
      from: USER_ADDRESS,
      to: BRIDGEHUB,
      data: CALL_DATA,
      value: 0,
      gasPrice: ethers.parseUnits("0.13", "gwei"),
    });
    console.log("✓ Gas estimation successful:", gasEstimate.toString());
  } catch (error) {
    console.log("✗ Gas estimation failed:");
    console.log("Error:", error.message);
    
    if (error.message.includes("insufficient allowance")) {
      console.log("");
      console.log("=== Diagnosis ===");
      console.log("The contract is reverting with 'insufficient allowance'");
      console.log("Current allowance:", ethers.formatEther(allowance), "WBNB");
      console.log("Required amount: 0.09 WBNB");
      console.log("");
      
      if (allowance >= ethers.parseEther("0.09")) {
        console.log("⚠️  Allowance is sufficient, but still failing!");
        console.log("Possible reasons:");
        console.log("1. The approval transaction hasn't been mined yet");
        console.log("2. The approval is to the wrong address");
        console.log("3. There's a bug in the contract logic");
        console.log("");
        console.log("Let's check if approval is to the correct address:");
        console.log("Expected: SharedBridge =", SHARED_BRIDGE);
      } else {
        console.log("✗ Allowance is NOT sufficient!");
        console.log("Need to approve more WBNB to SharedBridge");
      }
    }
  }
}

simulateCall().catch(console.error);
