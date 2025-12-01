# Faucet 模块快速参考

## 🚀 快速开始

### 1. 用户使用

```
访问: http://localhost:3000/faucet
网络: BSC Testnet (Chain ID: 97)
操作: 连接钱包 → 点击 "Claim Tokens" → 确认交易
```

### 2. 开发集成

```typescript
// 使用 Store
const faucetStore = useFaucetStore();
await faucetStore.claimTokens();

// 使用组件
<FaucetCard />
<FaucetQuickClaim show-when-balance="1000000000000000000" />
```

---

## 📋 合约信息

```
地址: 0xbd82c02831226b0cFD91Ce7A352056B41Ad364b0
网络: BSC Testnet (97)
代币: MAC (0x68da710056e0491B436c5ef6A1DFB246b2E882bC)
```

---

## 🔧 常用命令

### 查询

```bash
# 获取统计
cast call $FAUCET "getStats()" --rpc-url $RPC

# 查询用户信息
cast call $FAUCET "getUserClaimInfo(address)" $USER --rpc-url $RPC

# 检查余额
cast call $FAUCET "getFaucetBalance()" --rpc-url $RPC

# 检查是否可领取
cast call $FAUCET "canUserClaim(address)" $USER --rpc-url $RPC
```

### 管理 (需要 Owner 权限)

```bash
# 设置领取数量
cast send $FAUCET "setAmountPerClaim(uint256)" $AMOUNT --private-key $KEY

# 设置冷却时间 (秒)
cast send $FAUCET "setCooldown(uint256)" $SECONDS --private-key $KEY

# 设置最大领取次数
cast send $FAUCET "setMaxClaims(uint256)" $MAX --private-key $KEY

# 提取代币
cast send $FAUCET "withdrawTokens(uint256,address)" $AMOUNT $RECIPIENT --private-key $KEY
```

### 充值

```bash
# 1. 授权
cast send $TOKEN "approve(address,uint256)" $FAUCET $AMOUNT --private-key $KEY

# 2. 充值
cast send $FAUCET "fundFaucet(uint256)" $AMOUNT --private-key $KEY
```

---

## 📁 文件结构

```
contract/
├── AdvancedERC20Faucet.sol      # 合约源码
├── AdvancedERC20FaucetABI.json  # ABI
├── README.md                     # 合约文档
└── QUICK_REFERENCE.md           # 本文档

store/
└── faucet.ts                     # 状态管理

composables/
└── useFaucet.ts                  # 工具函数

components/
├── FaucetButton.vue              # 入口按钮
└── faucet/
    ├── FaucetCard.vue            # 信息卡片
    └── FaucetQuickClaim.vue      # 快速领取

pages/
└── faucet.vue                    # 主页面
```

---

## 🔑 核心 API

### Store Methods

```typescript
// 查询
faucetStore.requestFaucetStats()      // 统计信息
faucetStore.requestUserClaimInfo()    // 用户信息
faucetStore.checkCanClaim()           // 检查资格
faucetStore.requestFaucetToken()      // 代币信息

// 操作
faucetStore.claimTokens()             // 领取代币
faucetStore.resetClaimState()         // 重置状态
```

### Composable Functions

```typescript
const { 
  formatClaimAmount,      // 格式化金额
  getRemainingCooldown,   // 剩余冷却时间
  formatCooldownTime,     // 格式化时间
  isClaimable,           // 是否可领取
  getClaimProgress,      // 领取进度
  formatStats,           // 格式化统计
} = useFaucet();
```

### Contract Functions

```solidity
// 用户函数
claimTokens()                                    // 领取代币
canUserClaim(address) returns (bool, uint256)   // 检查资格
getUserClaimInfo(address) returns (...)         // 用户信息
getFaucetBalance() returns (uint256)            // Faucet 余额
getStats() returns (...)                        // 统计信息

// 管理员函数
setAmountPerClaim(uint256)                      // 设置领取量
setCooldown(uint256)                            // 设置冷却时间
setMaxClaims(uint256)                           // 设置最大次数
toggleWhitelist(bool)                           // 切换白名单
withdrawTokens(uint256, address)                // 提取代币
emergencyWithdraw()                             // 紧急提取
```

---

## 🎯 使用场景

### 场景 1: 在页面中显示 Faucet 卡片

```vue
<template>
  <div>
    <h1>Welcome</h1>
    <FaucetCard />
  </div>
</template>
```

### 场景 2: 余额不足时提示领取

```vue
<template>
  <FaucetQuickClaim 
    show-when-balance="1000000000000000000" 
  />
</template>
```

### 场景 3: 自定义领取按钮

```vue
<template>
  <button 
    @click="handleClaim"
    :disabled="!isClaimable || claiming"
  >
    {{ claiming ? 'Claiming...' : 'Claim Tokens' }}
  </button>
</template>

<script setup>
const faucetStore = useFaucetStore();
const { isClaimable } = useFaucet();
const claiming = ref(false);

const handleClaim = async () => {
  claiming.value = true;
  try {
    await faucetStore.claimTokens();
  } finally {
    claiming.value = false;
  }
};
</script>
```

---

## ⚠️ 注意事项

### 用户端

- ✅ 必须连接到 BSC Testnet
- ✅ 需要有 BNB 支付 gas 费
- ✅ 遵守冷却时间限制
- ✅ 注意领取次数限制

### 开发端

- ✅ 合约地址配置在 `data/networks.ts`
- ✅ 只在测试网显示 Faucet 功能
- ✅ 使用 TypeScript 确保类型安全
- ✅ 完善错误处理和用户提示

### 运维端

- ✅ 定期检查 Faucet 余额
- ✅ 及时充值避免用户无法领取
- ✅ 监控使用情况调整参数
- ✅ 保护好所有者私钥

---

## 🐛 调试技巧

### 查看合约状态

```javascript
// 在浏览器控制台
const faucetStore = useFaucetStore();
await faucetStore.requestFaucetStats();
console.log(faucetStore.faucetStats);
```

### 检查用户资格

```javascript
const { canClaim, timeRemaining } = await faucetStore.checkCanClaim();
console.log({ canClaim, timeRemaining: timeRemaining.toString() });
```

### 查看错误日志

```javascript
// 查看 Sentry 或浏览器控制台
console.log(faucetStore.claimError);
```

---

## 📊 监控指标

### 关键指标

```typescript
const stats = await faucetStore.requestFaucetStats();

// 总分发量
const distributed = formatUnits(stats.distributed, 18);

// 领取者数量
const claimers = stats.claimers.toString();

// Faucet 余额
const balance = formatUnits(stats.faucetBalance, 18);

// 单次领取量
const perClaim = formatUnits(stats.perClaimAmount, 18);

// 平均领取次数
const avgClaims = Number(stats.distributed) / Number(stats.claimers) / Number(stats.perClaimAmount);
```

---

## 🔗 快速链接

- [合约源码](./AdvancedERC20Faucet.sol)
- [合约 ABI](./AdvancedERC20FaucetABI.json)
- [详细文档](./README.md)
- [集成指南](../FAUCET_INTEGRATION.md)
- [模块总结](../CONTRACT_MODULE_SUMMARY.md)
- [BSCScan](https://testnet.bscscan.com/address/0xbd82c02831226b0cFD91Ce7A352056B41Ad364b0)

---

## 💬 常见问题

**Q: 如何添加新的 Faucet 合约?**
```typescript
// 在 data/networks.ts 中添加
faucetContract: "0x新合约地址"
```

**Q: 如何修改领取数量?**
```bash
cast send $FAUCET "setAmountPerClaim(uint256)" $NEW_AMOUNT --private-key $OWNER_KEY
```

**Q: 如何查看用户领取历史?**
```typescript
const info = await faucetStore.requestUserClaimInfo();
console.log({
  claims: info.totalClaims.toString(),
  amount: formatUnits(info.totalAmount, 18),
});
```

**Q: 如何禁用 Faucet?**
```bash
# 方法 1: 设置领取量为 0
cast send $FAUCET "setAmountPerClaim(uint256)" 0 --private-key $OWNER_KEY

# 方法 2: 提取所有代币
cast send $FAUCET "emergencyWithdraw()" --private-key $OWNER_KEY
```

---

**版本:** 1.0.0  
**更新:** 2024-12-01
