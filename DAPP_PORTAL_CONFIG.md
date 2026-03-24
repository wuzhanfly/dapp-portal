# dapp-portal 配置指南 - tMai Base Token

## 📋 tMai Chain 配置总结

### 1. 网络信息

```javascript
{
  // L1 网络 (BSC Testnet)
  l1: {
    chainId: 97,
    name: "BSC Testnet",
    rpcUrl: "http://13.212.114.138:10575",
    explorerUrl: "https://testnet.bscscan.com"
  },
  
  // L2 网络 (tMai Chain)
  l2: {
    chainId: 9720,
    name: "tMai Chain",
    rpcUrl: "http://54.255.184.251:3050",
    wsUrl: "ws://54.255.184.251:3051",
    explorerUrl: null  // 需要部署区块浏览器
  }
}
```

### 2. Base Token 配置

**关键特性：tMai 是 Base Token（不是 ETH）**

```javascript
{
  baseToken: {
    // L1 上的 tMai 代币地址
    l1Address: "0xc42f240c256f5fb97346b9d69d10e2e1d77b2eba",
    
    // L2 上的原生地址（系统合约）
    l2Address: "0x000000000000000000000000000000000000800a",
    
    // 代币信息
    symbol: "tMai",
    name: "tMai Token",
    decimals: 18,
    
    // Asset ID
    assetId: "0x4e73a994364cf4a1ea7961da544dd28b6b85d8b03ff387ea0a3732438a6c7bee"
  }
}
```

### 3. 核心合约地址

```javascript
{
  contracts: {
    // Bridgehub - 跨链入口
    bridgehub: "0xf07b8aa29e38d6014db87497ddc8b7e3a1cf465d",
    
    // Diamond Proxy - L2 主合约
    diamondProxy: "0x428ef545e2ee1f51512ce05ac22632a74efbe008",
    
    // Shared Bridge - 共享桥接
    sharedBridge: {
      l1: "0xc3a77c9fef8f14f1f39760cc2376f1eb8d60be4a",
      l2: "0x0000000000000000000000000000000000010003"
    },
    
    // ERC20 Bridge
    erc20Bridge: {
      l1: "0xaed878b4f465fa5cd1f64c35aa5a340e2506febd",
      l2: "0x0000000000000000000000000000000000010003"
    },
    
    // L1 Nullifier
    l1Nullifier: "0x9e36fac02abd87f49a9229b98d091997a3a6c668",
    
    // Native Token Vault
    nativeTokenVault: "0xa37b3cf61ed8b3e6740271e7a517fecc15920781"
  }
}
```

### 4. 跨链方法差异

**重要：Base Token 跨链方式与 ETH 不同！**

#### 标准 ETH 链（如 ZKsync Era）：
```javascript
// ETH 作为 value 直接发送
await bridgehub.requestL2TransactionDirect({
  chainId,
  l2Contract: recipient,
  l2Value: amount,  // ETH 金额
  // ...
}, { value: amount });  // 直接发送 ETH
```

#### Base Token 链（tMai Chain）：
```javascript
// 1. 先授权 tMai
await baseToken.approve(bridgehub.address, amount);

// 2. 通过 mintValue 跨链
await bridgehub.requestL2TransactionDirect({
  chainId,
  mintValue: amount,  // 铸造到 L2 的 tMai 数量
  l2Contract: recipient,
  l2Value: 0,  // 不使用 value
  // ...
});
// 注意：不需要 { value: ... }
```

### 5. Gas 费用处理

```javascript
{
  // L2 Gas 配置
  l2Gas: {
    gasLimit: 1000000,
    gasPerPubdataByteLimit: 800,
    
    // Gas 价格（Base Token 计价）
    gasPrice: "100000000",  // 0.1 Gwei in tMai
    
    // 预估 gas 费用
    estimatedFee: "0.0000124505 tMai"  // 约 124,505 gas
  }
}
```

### 6. 余额查询

```javascript
// L1 余额（ERC20）
const l1Balance = await baseTokenContract.balanceOf(address);

// L2 余额（原生代币）
const l2Balance = await l2Provider.getBalance(address);
```

### 7. 交易类型

```javascript
{
  // L1 → L2 跨链交易
  depositTx: {
    type: "0x71",  // Priority transaction
    from: userAddress,
    to: userAddress,
    value: 0,  // Base Token 不使用 value
    data: "0x"
  },
  
  // L2 普通交易
  l2Tx: {
    type: "0x71",
    from: userAddress,
    to: recipient,
    value: amount,  // L2 上可以直接使用 value
    gasPrice: "100000000"
  }
}
```

## 🔧 dapp-portal 需要修改的地方

### 1. 网络配置文件

通常在 `hyperchains.json` 或 `chains.config.ts`：

```json
{
  "9720": {
    "id": 9720,
    "key": "tmai-chain",
    "name": "tMai Chain",
    "rpcUrl": "http://54.255.184.251:3050",
    "explorerUrl": null,
    "l1Network": {
      "id": 97,
      "name": "BSC Testnet",
      "rpcUrl": "http://13.212.114.138:10575"
    },
    "baseToken": {
      "address": "0xc42f240c256f5fb97346b9d69d10e2e1d77b2eba",
      "symbol": "tMai",
      "name": "tMai Token",
      "decimals": 18,
      "iconUrl": "/tokens/tmai.svg"
    },
    "bridgeContracts": {
      "bridgehub": "0xf07b8aa29e38d6014db87497ddc8b7e3a1cf465d",
      "sharedBridge": "0xc3a77c9fef8f14f1f39760cc2376f1eb8d60be4a",
      "erc20Bridge": "0xaed878b4f465fa5cd1f64c35aa5a340e2506febd"
    }
  }
}
```

### 2. 跨链逻辑修改

需要修改的文件（通常在 `composables/` 或 `utils/`）：

```typescript
// 检测是否为 Base Token 链
const isBaseTokenChain = (chainId: number) => {
  const chain = chains[chainId];
  return chain?.baseToken?.address !== undefined;
};

// 跨链方法
async function bridgeToL2(amount: bigint, recipient: string) {
  const chain = chains[l2ChainId];
  
  if (isBaseTokenChain(l2ChainId)) {
    // Base Token 跨链流程
    const baseToken = new Contract(
      chain.baseToken.address,
      ERC20_ABI,
      signer
    );
    
    // 1. 授权
    const approveTx = await baseToken.approve(
      chain.bridgeContracts.bridgehub,
      amount
    );
    await approveTx.wait();
    
    // 2. 跨链
    const bridgehub = new Contract(
      chain.bridgeContracts.bridgehub,
      BRIDGEHUB_ABI,
      signer
    );
    
    const tx = await bridgehub.requestL2TransactionDirect({
      chainId: l2ChainId,
      mintValue: amount,  // 使用 mintValue
      l2Contract: recipient,
      l2Value: 0,
      l2Calldata: "0x",
      l2GasLimit: 1000000,
      l2GasPerPubdataByteLimit: 800,
      factoryDeps: [],
      refundRecipient: recipient
    });
    
    return tx;
  } else {
    // 标准 ETH 跨链流程
    // ... 原有逻辑
  }
}
```

### 3. 余额显示

```typescript
// 获取余额
async function getBalance(address: string, chainId: number) {
  const chain = chains[chainId];
  
  if (chain.l1Network) {
    // L1 余额（ERC20）
    const token = new Contract(
      chain.baseToken.address,
      ERC20_ABI,
      l1Provider
    );
    return await token.balanceOf(address);
  } else {
    // L2 余额（原生）
    return await l2Provider.getBalance(address);
  }
}
```

### 4. Gas 估算

```typescript
// Base Token 链的 gas 估算
async function estimateGas(amount: bigint) {
  // L2 gas 估算
  const l2GasLimit = 1000000n;
  const gasPrice = await l2Provider.getGasPrice();
  const l2GasFee = l2GasLimit * gasPrice;
  
  // L1 gas 估算（授权 + 跨链）
  const approveGas = 50000n;
  const bridgeGas = 200000n;
  const l1GasPrice = await l1Provider.getGasPrice();
  const l1GasFee = (approveGas + bridgeGas) * l1GasPrice;
  
  return {
    l1Fee: l1GasFee,  // BNB
    l2Fee: l2GasFee,  // tMai
    total: l1GasFee + l2GasFee  // 需要转换单位
  };
}
```

### 5. UI 显示调整

```vue
<template>
  <div class="bridge-form">
    <!-- 显示 Base Token 而不是 ETH -->
    <div class="token-info">
      <img :src="baseToken.iconUrl" />
      <span>{{ baseToken.symbol }}</span>
    </div>
    
    <!-- 余额显示 -->
    <div class="balance">
      L1 Balance: {{ formatBalance(l1Balance) }} {{ baseToken.symbol }}
    </div>
    
    <!-- Gas 费用提示 -->
    <div class="gas-fee">
      <span>L1 Gas (BNB): {{ formatGas(l1GasFee) }}</span>
      <span>L2 Gas ({{ baseToken.symbol }}): {{ formatGas(l2GasFee) }}</span>
    </div>
  </div>
</template>
```

## 📝 关键注意事项

1. **授权流程**：Base Token 需要先授权 Bridgehub
2. **mintValue vs value**：使用 `mintValue` 而不是交易的 `value`
3. **Gas 计价**：L2 gas 用 tMai 计价，不是 ETH
4. **余额查询**：L1 用 ERC20，L2 用原生余额
5. **图标资源**：需要添加 tMai 代币图标
6. **错误处理**：授权失败、余额不足等场景

## 🚀 测试清单

- [ ] 连接 BSC Testnet (Chain ID 97)
- [ ] 连接 tMai Chain (Chain ID 9720)
- [ ] 显示 tMai 余额（L1 和 L2）
- [ ] 授权 tMai 给 Bridgehub
- [ ] 跨链 tMai 到 L2
- [ ] 查看跨链交易状态
- [ ] L2 转账测试
- [ ] Gas 费用估算准确性

## 📚 参考文件

- 合约配置: `tmai_ecosystem/chains/tmai_chain/configs/contracts.yaml`
- 创世配置: `tmai_ecosystem/chains/tmai_chain/configs/genesis.yaml`
- 跨链脚本: `scripts/bridge_tmai_basetoken.js`
- L2 使用指南: `L2_BASETOKEN_USAGE_SUMMARY.md`
