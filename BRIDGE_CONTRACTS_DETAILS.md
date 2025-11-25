# zkSync Bridge 合约详细信息

## 📋 概述

本文档详细说明 `provider.getDefaultBridgeAddresses().sharedL1` 和相关桥接合约的具体信息、地址和调用方法。

## 🏗️ Bridge 合约架构

### zkSync Era 网络桥接合约

#### L1 合约 (Ethereum Mainnet)

| 合约名称 | 合约地址 | 获取方式 | 主要功能 |
|---------|----------|----------|----------|
| **L1 Shared Bridge** | `0x57891966931Eb4Bb6FB81430E6cE0A03AAbDe063` | `provider.getDefaultBridgeAddresses().sharedL1` | 标准存款/提取 |
| **L1 Asset Router** | `0x57891966931Eb4Bb6FB81430E6cE0A03AAbDe063` | 同 Shared Bridge | 资产路由管理 |
| **L1 Nullifier** | `0x303a465B659cBB0ab36eE643eA362c509EEb5213` | `IL1AssetRouterFactory.connect().L1_NULLIFIER()` | 提取完成验证 |

#### L2 合约 (zkSync Era)

| 合约名称 | 合约地址 | 获取方式 | 主要功能 |
|---------|----------|----------|----------|
| **L2 Shared Bridge** | `0x11f943b2c77b743AB90f4A0Ae7d5A4e7FCA3E102` | `provider.getDefaultBridgeAddresses().sharedL2` | 标准提取 |
| **L2 Asset Router** | `0x0000000000000000000000000000000000010003` | `L2_ASSET_ROUTER_ADDRESS` | 原生代币管理 |
| **L2 Native Token Vault** | `0x0000000000000000000000000000000000010004` | `L2_NATIVE_TOKEN_VAULT_ADDRESS` | 原生代币金库 |
| **L2 Base Token** | `0x000000000000000000000000000000000000800A` | `L2_BASE_TOKEN_ADDRESS` | L2 基础代币 |

### BSC zkStack 网络桥接合约

#### L1 合约 (BSC Testnet - Chain ID: 97)

| 合约名称 | 预期地址模式 | 获取方式 | 主要功能 |
|---------|-------------|----------|----------|
| **L1 Shared Bridge** | `0x[待部署地址]` | `provider.getDefaultBridgeAddresses().sharedL1` | BSC 存款/提取 |
| **L1 Asset Router** | `0x[待部署地址]` | 同 Shared Bridge | BSC 资产路由 |
| **L1 Nullifier** | `0x[待部署地址]` | `IL1AssetRouterFactory.connect().L1_NULLIFIER()` | BSC 提取完成 |

#### L2 合约 (BSC zkStack - Chain ID: 9720)

| 合约名称 | 合约地址 | 获取方式 | 主要功能 |
|---------|----------|----------|----------|
| **L2 Shared Bridge** | `0x[部署地址]` | `provider.getDefaultBridgeAddresses().sharedL2` | BSC zkStack 提取 |
| **L2 Asset Router** | `0x0000000000000000000000000000000000010003` | `L2_ASSET_ROUTER_ADDRESS` | 原生 BNB 管理 |
| **L2 Native Token Vault** | `0x0000000000000000000000000000000000010004` | `L2_NATIVE_TOKEN_VAULT_ADDRESS` | BNB 金库 |
| **L2 Base Token** | `0x000000000000000000000000000000000000800A` | `L2_BASE_TOKEN_ADDRESS` | L2 基础 BNB |

## 🔍 合约地址获取详解

### 1. `provider.getDefaultBridgeAddresses()` 方法

```typescript
// zkSync SDK 内部实现 (简化版)
class Provider {
  async getDefaultBridgeAddresses(): Promise<{
    sharedL1: string;
    sharedL2: string;
    erc20L1: string;
    erc20L2: string;
  }> {
    // 从 zkSync 网络配置中获取默认桥地址
    const bridgeAddresses = await this.send("zks_getBridgeContracts", []);
    
    return {
      sharedL1: bridgeAddresses.l1SharedDefaultBridge,    // L1 共享桥
      sharedL2: bridgeAddresses.l2SharedDefaultBridge,    // L2 共享桥
      erc20L1: bridgeAddresses.l1Erc20DefaultBridge,      // L1 ERC20 桥 (已弃用)
      erc20L2: bridgeAddresses.l2Erc20DefaultBridge,      // L2 ERC20 桥 (已弃用)
    };
  }
}

// 实际调用示例
const provider = await providerStore.requestProvider();
const bridgeAddresses = await provider.getDefaultBridgeAddresses();

console.log("L1 Shared Bridge:", bridgeAddresses.sharedL1);
console.log("L2 Shared Bridge:", bridgeAddresses.sharedL2);
```

### 2. 网络特定的桥地址

#### zkSync Era Mainnet (Chain ID: 324)
```typescript
const bridgeAddresses = {
  sharedL1: "0x57891966931Eb4Bb6FB81430E6cE0A03AAbDe063",  // L1SharedBridge
  sharedL2: "0x11f943b2c77b743AB90f4A0Ae7d5A4e7FCA3E102",  // L2SharedBridge
  erc20L1: "0x57891966931Eb4Bb6FB81430E6cE0A03AAbDe063",   // 同 sharedL1
  erc20L2: "0x11f943b2c77b743AB90f4A0Ae7d5A4e7FCA3E102",   // 同 sharedL2
};
```

#### zkSync Era Sepolia (Chain ID: 300)
```typescript
const bridgeAddresses = {
  sharedL1: "0xD7f9f54194C633F36CCD5F3da84ad4a1c38cB2cB",  // L1SharedBridge
  sharedL2: "0x681A1afDC2e06776816386500D2D461a6C96cB45",  // L2SharedBridge
  erc20L1: "0xD7f9f54194C633F36CCD5F3da84ad4a1c38cB2cB",   // 同 sharedL1
  erc20L2: "0x681A1afDC2e06776816386500D2D461a6C96cB45",   // 同 sharedL2
};
```

#### BSC zkStack (Chain ID: 9720)
```typescript
// 注意: BSC zkStack 的具体地址需要从实际部署中获取
const bridgeAddresses = {
  sharedL1: "0x[BSC_L1_SHARED_BRIDGE_ADDRESS]",  // 待部署
  sharedL2: "0x[BSC_L2_SHARED_BRIDGE_ADDRESS]",  // 待部署
  erc20L1: "0x[BSC_L1_SHARED_BRIDGE_ADDRESS]",   // 同 sharedL1
  erc20L2: "0x[BSC_L2_SHARED_BRIDGE_ADDRESS]",   // 同 sharedL2
};
```

## 🔄 合约方法详解

### L1 Shared Bridge 合约

#### 主要方法签名

```solidity
// L1SharedBridge.sol
contract L1SharedBridge {
    // 存款方法
    function deposit(
        uint256 _chainId,                    // 目标链 ID (324 for Era, 9720 for BSC zkStack)
        address _prevMsgSender,              // 消息发送者
        address _l1Token,                    // L1 代币地址
        uint256 _amount,                     // 存款金额
        uint256 _l2TxGasLimit,              // L2 交易 gas 限制
        uint256 _l2TxGasPerPubdataByte,     // 每字节 pubdata 的 gas
        address _refundRecipient             // 退款接收者
    ) external payable returns (bytes32 txHash);
    
    // 声明失败存款
    function claimFailedDeposit(
        uint256 _chainId,
        address _depositSender,
        address _l1Token,
        uint256 _amount,
        bytes32 _l2TxHash,
        uint256 _l2BatchNumber,
        uint256 _l2MessageIndex,
        uint16 _l2TxNumberInBatch,
        bytes32[] calldata _merkleProof
    ) external;
    
    // 完成提取 (通过 L1 Nullifier 调用)
    function finalizeWithdrawal(
        uint256 _chainId,
        uint256 _l2BatchNumber,
        uint256 _l2MessageIndex,
        uint16 _l2TxNumberInBatch,
        bytes calldata _message,
        bytes32[] calldata _merkleProof
    ) external;
}
```

#### 调用示例

```typescript
// 1. ETH 存款
const depositTx = await l1SharedBridge.deposit(
  324,                                    // zkSync Era 链 ID
  userAddress,                           // 发送者地址
  "0x0000000000000000000000000000000000000000", // ETH 地址
  parseEther("1.0"),                     // 1 ETH
  200000,                                // L2 gas 限制
  800,                                   // gas per pubdata
  userAddress,                           // 退款接收者
  { 
    value: parseEther("1.0") + baseCost, // ETH 金额 + 基础成本
    gasPrice: gasPrice,                  // gas 价格
    gasLimit: 300000                     // L1 gas 限制
  }
);

// 2. ERC20 代币存款 (需要先授权)
// 2.1 授权代币
await erc20Token.approve(l1SharedBridgeAddress, amount);

// 2.2 存款
const depositTx = await l1SharedBridge.deposit(
  324,                                   // zkSync Era 链 ID
  userAddress,                          // 发送者地址
  erc20TokenAddress,                    // ERC20 代币地址
  amount,                               // 代币金额
  200000,                               // L2 gas 限制
  800,                                  // gas per pubdata
  userAddress,                          // 退款接收者
  { 
    value: baseCost,                    // 只需支付基础成本
    gasPrice: gasPrice,
    gasLimit: 300000
  }
);
```

### L2 Shared Bridge 合约

#### 主要方法签名

```solidity
// L2SharedBridge.sol
contract L2SharedBridge {
    // 提取方法
    function withdraw(
        address _l1Receiver,                 // L1 接收地址
        address _l2Token,                    // L2 代币地址
        uint256 _amount                      // 提取金额
    ) external returns (bytes32 txHash);
    
    // 获取 L1 代币地址
    function l1TokenAddress(address _l2Token) external view returns (address);
    
    // 获取 L2 代币地址
    function l2TokenAddress(address _l1Token) external view returns (address);
}
```

#### 调用示例

```typescript
// 1. ETH 提取
const withdrawTx = await l2SharedBridge.withdraw(
  userL1Address,                         // L1 接收地址
  "0x000000000000000000000000000000000000800A", // L2 ETH 地址
  parseEther("1.0"),                     // 1 ETH
  {
    gasPrice: gasPrice,
    gasLimit: 200000
  }
);

// 2. ERC20 代币提取
const withdrawTx = await l2SharedBridge.withdraw(
  userL1Address,                         // L1 接收地址
  l2TokenAddress,                        // L2 代币地址
  amount,                                // 代币金额
  {
    gasPrice: gasPrice,
    gasLimit: 200000
  }
);
```

### L1 Nullifier 合约

#### 主要方法签名

```solidity
// IL1Nullifier.sol
interface IL1Nullifier {
    struct FinalizeL1DepositParams {
        uint256 chainId;                     // 链 ID
        uint256 l1BatchNumber;               // L1 批次号
        uint256 l2MessageIndex;              // L2 消息索引
        address l2Sender;                    // L2 发送者
        uint16 l2TxNumberInBatch;           // 批次中的交易号
        bytes message;                       // 跨链消息
        bytes32[] merkleProof;               // Merkle 证明
    }
    
    // 完成存款 (实际是完成提取)
    function finalizeDeposit(
        FinalizeL1DepositParams calldata _finalizeDepositParams
    ) external;
}
```

#### 调用示例

```typescript
// 完成提取
const finalizeParams = {
  chainId: 324,                          // zkSync Era 链 ID
  l1BatchNumber: batchNumber,            // 从提取证明获取
  l2MessageIndex: messageIndex,          // 从提取证明获取
  l2Sender: userL2Address,              // L2 发送者地址
  l2TxNumberInBatch: txNumberInBatch,   // 从提取证明获取
  message: withdrawalMessage,            // 从提取证明获取
  merkleProof: proof                     // Merkle 证明数组
};

const finalizeTx = await l1Nullifier.finalizeDeposit(finalizeParams, {
  gasPrice: gasPrice,
  gasLimit: 300000
});
```

## 🔧 BSC zkStack 特殊配置

### 网络配置

```typescript
// BSC zkStack 网络配置
const bscZkStackConfig = {
  l1Network: {
    chainId: 97,                         // BSC Testnet
    name: "BSC Testnet",
    rpcUrl: "http://47.130.24.70:10575", // 自定义 BSC RPC
    nativeCurrency: {
      name: "Test BNB",
      symbol: "TBNB",
      decimals: 18
    }
  },
  l2Network: {
    chainId: 9720,                       // BSC zkStack
    name: "ZK BSC Chain",
    rpcUrl: "http://13.228.79.240:3050", // BSC zkStack RPC
    blockExplorerUrl: "http://54.255.170.191:3010"
  }
};
```

### BSC 兼容性处理

```typescript
// 1. 强制使用传统交易类型
const bscCompatibleOverrides = {
  type: 0,                              // 传统交易类型 (非 EIP-1559)
  gasPrice: await getGasPrice(),        // 使用 gasPrice
  gasLimit: estimatedGasLimit,
  maxFeePerGas: undefined,              // 禁用 EIP-1559
  maxPriorityFeePerGas: undefined       // 禁用 EIP-1559
};

// 2. BSC gas 价格获取
const getBscGasPrice = async () => {
  try {
    const gasPrice = await publicClient.getGasPrice();
    return (BigInt(gasPrice) * 130n) / 100n; // 130% 缓冲区
  } catch (error) {
    // BSC Testnet 回退价格: 6.5 gwei
    return BigInt("6500000000");
  }
};

// 3. BSC 存款调用示例
const bscDepositTx = await wallet.deposit({
  to: l2ReceiverAddress,
  token: l1TokenAddress,
  amount: depositAmount,
  l2GasLimit: 200000,
  approveBaseERC20: true,
  overrides: bscCompatibleOverrides      // 使用 BSC 兼容的覆盖参数
});
```

## 📊 合约事件监听

### L1 Shared Bridge 事件

```solidity
// 存款初始化事件
event BridgehubDepositInitiated(
    uint256 indexed chainId,
    bytes32 indexed txDataHash,
    address indexed from,
    address to,
    address l1Token,
    uint256 amount
);

// 存款完成事件
event BridgehubDepositFinalized(
    uint256 indexed chainId,
    bytes32 indexed txDataHash,
    bytes32 indexed l2DepositTxHash
);

// 提取完成事件
event WithdrawalFinalized(
    uint256 indexed chainId,
    address indexed to,
    address indexed l1Token,
    uint256 amount
);
```

### L2 Shared Bridge 事件

```solidity
// 提取初始化事件
event WithdrawalInitiated(
    address indexed l2Sender,
    address indexed l1Receiver,
    address indexed l2Token,
    uint256 amount
);
```

### 事件监听示例

```typescript
// 监听 L1 存款事件
const l1SharedBridge = new ethers.Contract(
  bridgeAddresses.sharedL1,
  L1_SHARED_BRIDGE_ABI,
  l1Provider
);

l1SharedBridge.on("BridgehubDepositInitiated", (
  chainId,
  txDataHash,
  from,
  to,
  l1Token,
  amount,
  event
) => {
  console.log("Deposit initiated:", {
    chainId: chainId.toString(),
    from,
    to,
    token: l1Token,
    amount: amount.toString(),
    txHash: event.transactionHash
  });
});

// 监听 L2 提取事件
const l2SharedBridge = new ethers.Contract(
  bridgeAddresses.sharedL2,
  L2_SHARED_BRIDGE_ABI,
  l2Provider
);

l2SharedBridge.on("WithdrawalInitiated", (
  l2Sender,
  l1Receiver,
  l2Token,
  amount,
  event
) => {
  console.log("Withdrawal initiated:", {
    from: l2Sender,
    to: l1Receiver,
    token: l2Token,
    amount: amount.toString(),
    txHash: event.transactionHash
  });
});
```

## 🔍 调试和验证

### 合约地址验证

```typescript
// 验证桥合约地址
const verifyBridgeAddresses = async () => {
  const provider = await providerStore.requestProvider();
  const addresses = await provider.getDefaultBridgeAddresses();
  
  console.log("Bridge Addresses:", {
    network: provider.connection.url,
    chainId: await provider.getNetwork().then(n => n.chainId),
    sharedL1: addresses.sharedL1,
    sharedL2: addresses.sharedL2,
    erc20L1: addresses.erc20L1,
    erc20L2: addresses.erc20L2
  });
  
  // 验证合约是否存在
  const l1Code = await l1Provider.getCode(addresses.sharedL1);
  const l2Code = await provider.getCode(addresses.sharedL2);
  
  console.log("Contract verification:", {
    l1ContractExists: l1Code !== "0x",
    l2ContractExists: l2Code !== "0x"
  });
};
```

### 交易状态检查

```typescript
// 检查存款状态
const checkDepositStatus = async (l1TxHash: string) => {
  const l1Receipt = await l1Provider.getTransactionReceipt(l1TxHash);
  const l2TxHash = await provider.getL2TransactionFromPriorityOp(l1Receipt);
  
  if (l2TxHash) {
    const l2Receipt = await provider.getTransactionReceipt(l2TxHash);
    console.log("Deposit status:", {
      l1Confirmed: l1Receipt.status === 1,
      l2TxHash,
      l2Confirmed: l2Receipt?.status === 1
    });
  }
};

// 检查提取状态
const checkWithdrawalStatus = async (l2TxHash: string) => {
  const l2Receipt = await provider.getTransactionReceipt(l2TxHash);
  const withdrawalDetails = await provider.getTransactionDetails(l2TxHash);
  
  console.log("Withdrawal status:", {
    l2Confirmed: l2Receipt?.status === 1,
    status: withdrawalDetails.status,
    canFinalize: withdrawalDetails.status === "verified"
  });
};
```

## 📝 总结

`provider.getDefaultBridgeAddresses().sharedL1` 返回的是 **L1 Shared Bridge 合约地址**，这是 zkSync 生态系统中最重要的桥接合约之一：

### 关键要点：

1. **统一桥接**: Shared Bridge 是新架构下的统一桥接合约，替代了旧的 ERC20 桥
2. **多链支持**: 同一个 L1 合约可以支持多个 L2 链 (Era, BSC zkStack 等)
3. **动态获取**: 地址通过 RPC 调用 `zks_getBridgeContracts` 动态获取，确保准确性
4. **网络特定**: 不同网络 (Mainnet, Testnet, BSC) 有不同的合约地址
5. **版本兼容**: 新版本 zkSync SDK 统一使用 Shared Bridge，向后兼容旧的 ERC20 桥

### 实际地址示例：
- **zkSync Era Mainnet**: `0x57891966931Eb4Bb6FB81430E6cE0A03AAbDe063`
- **zkSync Era Sepolia**: `0xD7f9f54194C633F36CCD5F3da84ad4a1c38cB2cB`
- **BSC zkStack**: 需要从实际部署中获取

这个合约是所有存款操作的入口点，负责处理 ETH 和 ERC20 代币的跨链转移。