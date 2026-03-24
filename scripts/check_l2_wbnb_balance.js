const { ethers } = require("ethers");

const L2_RPC_URL = "https://testnet-node-0.maichain.org/";
const USER_ADDRESS = "0x7CB5c1C44f7729a34F07Bb67603d65D81a8cD16a";
const L2_WBNB_ADDRESS = "0x664911fA56454Fc075946A07A430c7d0671E6F13";

const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
];

async function main() {
  const provider = new ethers.JsonRpcProvider(L2_RPC_URL);
  const wbnb = new ethers.Contract(L2_WBNB_ADDRESS, ERC20_ABI, provider);

  console.log("=== L2 WBNB 余额查询 ===\n");
  console.log("用户地址:", USER_ADDRESS);
  console.log("L2 WBNB 地址:", L2_WBNB_ADDRESS);
  console.log("");

  try {
    const balance = await wbnb.balanceOf(USER_ADDRESS);
    const symbol = await wbnb.symbol();
    const decimals = await wbnb.decimals();

    console.log("余额:", ethers.formatUnits(balance, decimals), symbol);
    console.log("原始值:", balance.toString());
  } catch (error) {
    console.error("查询失败:", error.message);
  }
}

main().catch(console.error);
