# BSC zkStack (Chain ID: 9720) 实际合约地址

## 📋 网络验证结果

✅ **网络连接成功验证**
- **L2 Chain ID**: `9720` (0x25f8) ✅
- **L1 Chain ID**: `97` (0x61) ✅
- **L2 最新区块**: `344`
- **L1 最新区块**: `71,085,472`

## 🏗️ 实际合约地址

### **L1 合约 (BSC Testnet - Chain ID: 97)**

| 合约名称 | 实际地址 | 状态 | 功能描述 |
|---------|----------|------|----------|
| **L1 Shared Bridge** | `0x5534b4f2ec5a2c4fb36e5c7e9ab4887987bacfc2` | ✅ 已部署 | 主要存款/提取桥接合约 |
| **L1 ERC20 Bridge** | `0xcdbed3a321a375f8eecfd5c4a862d4822a9295ce` | ✅ 已部署 | ERC20 代币专用桥接 |
| **L1 Base Token** | `0x0000000000000000000000000000000000000001` | - | L1 基础代币合约地址 |

### **L2 合约 (BSC zkStack - Chain ID: 9720)**

| 合约名称 | 实际地址 | 状态 | 功能描述 |
|---------|----------|------|----------|
| **L2 Shared Bridge** | `0x0000000000000000000000000000000000010003` | ✅ 已部署 | L2 主要桥接合约 |
| **L2 Asset Router** | `0x0000000000000000000000000000000000010003` | ✅ 系统合约 | 资产路由管理 |
| **L2 Native Token Vault** | `0x0000000000000000000000000000000000010004` | ✅ 系统合约 | 原生代币金库 |
| **L2 Base Token** | `0x000000000000000000000000000000000000800A` | ✅ 系统合约 | L2 基础代币 (BNB) |

### **L2 系统合约 (固定地址)**

| 合约名称 | 地址 | 功能 |
|---------|------|------|
| **Bootloader** | `0x0000000000000000000000000000000000008001` | 系统引导加载器 |
| **Account Code Storage** | `0x0000000000000000000000000000000000008002` | 账户代码存储 |
| **Nonce Holder** | `0x0000000000000000000000000000000000008003` | Nonce 管理 |
| **Contract Deployer** | `0x0000000000000000000000000000000000008006` | 合约部署器 |
| **L1 Messenger** | `0x0000000000000000000000000000000000008008` | L1 消息传递 |

## 🔄 `provider.getDefaultBridgeAddresses()` 返回值

```typescript
// BSC zkStack 实际返回的桥地址
const bridgeAddresses = {
  sharedL1: "0x5534b4f2ec5a2c4fb36e5c7e9ab4887987bacfc2",  // L1 Shared Bridge
  sharedL2: "0x0000000000000000000000000000000000010003",  // L2 Shared Bridge (Asset Router)
  erc20L1: "0xcdbed3a321a375f8eecfd5c4a862d4822a9295ce",   // L1 ERC20 Bridge
  erc20L2: "0x0000000000000000000000000000000000010003",   // L2 ERC20 Bridge (同 Asset Router)
};
```

## 💡 关键发现

### **1. L2 桥接架构**
- BSC zkStack 使用 **Asset Router** (`0x010003`) 作为主要的 L2 桥接合约
- 这与标准 zkSync Era 不同，Era 有独立的 L2 Shared Bridge 地址
- Asset Router 同时处理 Shared Bridge 和 ERC20 Bridge 功能

### **2. L1 桥接架构**
- **L1 Shared Bridge**: `0x5534b4f2ec5a2c4fb36e5c7e9ab4887987bacfc2`
- **L1 ERC20 Bridge**: `0xcdbed3a321a375f8eecfd5c4a862d4822a9295ce`
- 两个独立的 L1 合约处理不同类型的桥接操作

### **3. 代币配置**
- **L1 Base Token**: `0x0000000000000000000000000000000000000001` (特殊地址)
- **L2 Base Token**: `0x000000000000000000000000000000000000800A` (标准 zkSync L2 基础代币地址)

## 🔧 实际使用示例

### **存款操作**

```typescript
// BSC zkStack 存款配置
const depositConfig = {
  // L1 网络配置
  l1: {
    chainId: 97,
    rpcUrl: "http://47.130.24.70:10575",
    bridgeAddress: "0x5534b4f2ec5a2c4fb36e5c7e9ab4887987bacfc2", // L1 Shared Bridge
  },
  
  // L2 网络配置
  l2: {
    chainId: 9720,
    rpcUrl: "http://13.228.79.240:3050",
    bridgeAddress: "0x0000000000000000000000000000000000010003", // L2 Asset Router
  },
  
  // 代币配置
  tokens: {
    l1BaseToken: "0x0000000000000000000000000000000000000001", // L1 BNB
    l2BaseToken: "0x000000000000000000000000000000000000800A", // L2 BNB
  }
};

// 存款调用示例
const depositTx = await l1SharedBridge.deposit(
  9720,                                    // BSC zkStack Chain ID
  userAddress,                            // 发送者地址
  "0x0000000000000000000000000000000000000000", // BNB 地址 (零地址)
  parseEther("1.0"),                      // 1 BNB
  200000,                                 // L2 gas 限制
  800,                                    // gas per pubdata
  userAddress,                            // 退款接收者
  {
    value: parseEther("1.0") + baseCost,  // BNB 金额 + 基础成本
    gasPrice: gasPrice,                   // BSC 兼容的 gas 价格
    gasLimit: 300000,                     // L1 gas 限制
    type: 0                               // 强制传统交易类型
  }
);
```

### **提取操作**

```typescript
// BSC zkStack 提取配置
const withdrawTx = await l2AssetRouter.withdraw(
  userL1Address,                          // L1 接收地址
  "0x000000000000000000000000000000000000800A", // L2 BNB 地址
  parseEther("1.0"),                      // 1 BNB
  {
    gasPrice: gasPrice,                   // L2 gas 价格
    gasLimit: 200000,                     // L2 gas 限制
    type: 0                               // 传统交易类型
  }
);
```

## 📊 网络状态监控

### **RPC 端点验证**

```bash
# 验证 L2 网络 (BSC zkStack)
curl -X POST http://13.228.79.240:3050/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
# 返回: {"jsonrpc":"2.0","id":1,"result":"0x25f8"} (9720)

# 验证 L1 网络 (BSC Testnet)
curl -X POST http://47.130.24.70:10575 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
# 返回: {"jsonrpc":"2.0","id":1,"result":"0x61"} (97)

# 获取桥合约地址
curl -X POST http://13.228.79.240:3050/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"zks_getBridgeContracts","params":[],"id":1}'
```

### **合约验证**

```typescript
// 验证 L1 Shared Bridge 合约
const l1Provider = new ethers.JsonRpcProvider("http://47.130.24.70:10575");
const l1Code = await l1Provider.getCode("0x5534b4f2ec5a2c4fb36e5c7e9ab4887987bacfc2");
console.log("L1 Bridge deployed:", l1Code !== "0x"); // true

// 验证 L2 Asset Router 合约
const l2Provider = new Provider("http://13.228.79.240:3050");
const l2Code = await l2Provider.getCode("0x0000000000000000000000000000000000010003");
console.log("L2 Bridge deployed:", l2Code !== "0x"); // true
```

## 🎯 项目集成配置

### **更新 hyperchains/config.json**

```json
{
  "network": {
    "id": 9720,
    "key": "zk_bsc_chain",
    "name": "ZK BSC Chain",
    "rpcUrl": "http://13.228.79.240:3050/",
    "blockExplorerUrl": "http://54.255.170.191:3010",
    "blockExplorerApi": "http://54.255.170.191:3002",
    "l1Network": {
      "id": 97,
      "name": "BSC Testnet",
      "rpcUrls": {
        "default": {
          "http": ["http://47.130.24.70:10575"]
        }
      }
    },
    "contracts": {
      "l1SharedBridge": "0x5534b4f2ec5a2c4fb36e5c7e9ab4887987bacfc2",
      "l2SharedBridge": "0x0000000000000000000000000000000000010003",
      "l1Erc20Bridge": "0xcdbed3a321a375f8eecfd5c4a862d4822a9295ce",
      "l2Erc20Bridge": "0x0000000000000000000000000000000000010003"
    }
  }
}
```

### **代码中的使用**

```typescript
// 在 zkSync Portal 项目中使用实际地址
const BSC_ZKSTACK_ADDRESSES = {
  L1_SHARED_BRIDGE: "0x5534b4f2ec5a2c4fb36e5c7e9ab4887987bacfc2",
  L2_SHARED_BRIDGE: "0x0000000000000000000000000000000000010003", // Asset Router
  L1_ERC20_BRIDGE: "0xcdbed3a321a375f8eecfd5c4a862d4822a9295ce",
  L2_ERC20_BRIDGE: "0x0000000000000000000000000000000000010003", // Asset Router
  L1_BASE_TOKEN: "0x0000000000000000000000000000000000000001",
  L2_BASE_TOKEN: "0x000000000000000000000000000000000000800A",
};

// 在存款流程中使用
const bridgeAddress = BSC_ZKSTACK_ADDRESSES.L1_SHARED_BRIDGE;
const depositTx = await wallet.deposit({
  to: l2ReceiverAddress,
  token: l1TokenAddress,
  amount: depositAmount,
  bridgeAddress: bridgeAddress, // 使用实际的桥地址
  overrides: {
    type: 0, // BSC 兼容
    gasPrice: gasPrice,
    gasLimit: gasLimit
  }
});
```

## 📝 总结

BSC zkStack (Chain ID: 9720) 的实际合约地址已成功获取并验证：

### **关键地址**:
- **L1 Shared Bridge**: `0x5534b4f2ec5a2c4fb36e5c7e9ab4887987bacfc2`
- **L2 Asset Router**: `0x0000000000000000000000000000000000010003`
- **L1 ERC20 Bridge**: `0xcdbed3a321a375f8eecfd5c4a862d4822a9295ce`

### **架构特点**:
1. L2 使用 Asset Router 作为统一桥接合约
2. L1 有独立的 Shared Bridge 和 ERC20 Bridge
3. 所有合约均已部署并可正常使用
4. 网络状态良好，区块正常生成

这些地址可以直接用于 zkSync Portal 项目中的 BSC zkStack 集成。