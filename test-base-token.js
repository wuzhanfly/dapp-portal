// 测试 Base Token 配置
const config = require('./hyperchains/config.json');

console.log('=== Base Token 配置测试 ===\n');

const network = config[0].network;

console.log('网络信息:');
console.log('  ID:', network.id);
console.log('  名称:', network.name);
console.log('  RPC URL:', network.rpcUrl);
console.log('');

if (network.baseToken) {
  console.log('✅ Base Token 配置已找到:');
  console.log('  L1 地址:', network.baseToken.l1Address);
  console.log('  L2 地址:', network.baseToken.l2Address);
  console.log('  符号:', network.baseToken.symbol);
  console.log('  名称:', network.baseToken.name);
  console.log('  小数位:', network.baseToken.decimals);
  console.log('');
} else {
  console.log('❌ Base Token 配置未找到');
  console.log('');
}

if (network.bridgeContracts) {
  console.log('✅ Bridge 合约配置已找到:');
  console.log('  Bridgehub:', network.bridgeContracts.bridgehub);
  console.log('  Shared Bridge:', network.bridgeContracts.sharedBridge);
  console.log('  ERC20 Bridge:', network.bridgeContracts.erc20Bridge);
  console.log('');
} else {
  console.log('❌ Bridge 合约配置未找到');
  console.log('');
}

console.log('代币列表:');
config[0].tokens.forEach((token, index) => {
  console.log(`  ${index + 1}. ${token.symbol} (${token.name})`);
  console.log(`     L2 地址: ${token.address}`);
  console.log(`     L1 地址: ${token.l1Address}`);
});

console.log('\n=== 测试完成 ===');
