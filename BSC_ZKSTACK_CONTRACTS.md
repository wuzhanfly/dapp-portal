# BSC zkStack (Chain ID: 9720) 合约地址详情

## 📋 网络信息

### **BSC zkStack 网络配置**
- **L2 Chain ID**: `9720`
- **L2 Network Name**: `ZK BSC Chain`
- **L2 RPC URL**: `http://13.228.79.240:3050/`
- **L2 Block Explorer**: `http://54.255.170.191:3010`
- **L2 Block Explorer API**: `http://54.255.170.191:3002`

### **BSC Testnet L1 网络配置**
- **L1 Chain ID**: `97`
- **L1 Network Name**: `BSC Testnet`
- **L1 RPC URL**: `http://47.130.24.70:10575`
- **L1 Block Explorer**: `https://testnet.bscscan.com`

## 🔗 获取实际合约地址

### 方法 1: 通过 zkSync Provider 获取

```typescript
// 连接到 BSC zkStack
import { Provider } from "zksync-ethers";

const getBscZkStackBridgeAddresses = async () => {
  // 连接到 BSC zkStack RPC
  const provider = new Provider("http://13.228.79.240:3050/");
  
  try {
    // 获取默认桥地址
    const bridgeAddresses = await provider.getDefaultBridgeAddresses();
    
    console.log("BSC zkStack Bridge Addresses:", {
      chainId: await provider.getNetwork().then(n => n.chainId), // 应该是 9720
      sharedL1: bridgeAddresses.sharedL1,    // L1 Shared Bridge 地址
      sharedL2: bridgeAddresses.sharedL2,    // L2 Shared Bridge 地址
      erc20L1: bridgeAddresses.erc20L1,      // L1 ERC20 Bridge (通常同 sharedL1)
      erc20L2: bridgeAddresses.erc20L2,      // L2 ERC20 Bridge (通常同 sharedL2)
    });
    
    return bridgeAddresses;
  } catch (error) {
    console.error("Failed to get bridge addresses:", error);
    throw error;
  }
};

// 使用示例
getBscZkStackBridgeAddresses()
  .then(addresses => {
    console.log("L1 Bridge Address:", addresses.sharedL1);
    console.log("L2 Bridge Address:", addresses.sharedL2);
  })
  .catch(console.error);
```

### 方法 2: 通过 RPC 直接调用

```typescript
// 直接调用 zks_getBridgeContracts RPC 方法
const getBridgeContractsRPC = async () => {
  const response = await fetch("http://13.228.79.240:3050/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "zks_getBridgeContracts",
      params: [],
      id: 1,
    }),
  });
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(`RPC Error: ${data.error.message}`);
  }
  
  console.log("Bridge Contracts from RPC:", data.result);
  return data.result;
};

// 使用示例
getBridgeContractsRPC()
  .then(contracts => {
    console.log("L1 Shared Bridge:", contracts.l1SharedDefaultBridge);
    console.log("L2 Shared Bridge:", contracts.l2SharedDefaultBridge);
    console.log("L1 ERC20 Bridge:", contracts.l1Erc20DefaultBridge);
    console.log("L2 ERC20 Bridge:", contracts.l2Erc20DefaultBridge);
  })
  .catch(console.error);
```

### 方法 3: 从项目配置中获取

```typescript
// 从项目的 hyperchains 配置获取
import hyperchainsConfig from "@/hyperchains/config.json";

const getBscConfigFromProject = () => {
  const bscConfig = hyperchainsConfig.find(
    config => config.network.id === 9720
  );
  
  if (!bscConfig) {
    throw new Error("BSC zkStack config not found");
  }
  
  console.log("BSC zkStack Configuration:", {
    chainId: bscConfig.network.id,
    name: bscConfig.network.name,
    rpcUrl: bscConfig.network.rpcUrl,
    blockExplorer: bscConfig.network.blockExplorerUrl,
    l1ChainId: bscConfig.network.l1Network.id,
    l1Name: bscConfig.network.l1Network.name,
    l1RpcUrl: bscConfig.network.l1Network.rpcUrls.default.http[0],
  });
  
  return bscConfig;
};
```

## 🏗️ 预期合约架构

基于 zkSync 标准架构，BSC zkStack 应该具有以下合约结构：

### **L1 合约 (BSC Testnet - Chain ID: 97)**

```typescript
// 预期的 L1 合约地址结构
interface BSC_L1_Contracts {
  // 主要桥接合约
  L1SharedBridge: string;        // 统一桥接合约
  L1AssetRouter: string;         // 资产路由合约 (通常同 SharedBridge)
  L1Nullifier: string;           // 提取完成验证合约
  
  // 辅助合约
  Bridgehub: string;             // 桥接枢纽合约
  StateTransitionManager: string; // 状态转换管理合约
  ValidatorTimelock: string;     // 验证者时间锁合约
}

// 实际地址需要通过 RPC 获取
const bscL1Contracts: BSC_L1_Contracts = {
  L1SharedBridge: "0x[实际部署地址]",
  L1AssetRouter: "0x[实际部署地址]",
  L1Nullifier: "0x[实际部署地址]",
  Bridgehub: "0x[实际部署地址]",
  StateTransitionManager: "0x[实际部署地址]",
  ValidatorTimelock: "0x[实际部署地址]",
};
```

### **L2 合约 (BSC zkStack - Chain ID: 9720)**

```typescript
// L2 系统合约地址 (固定地址)
const BSC_L2_SYSTEM_CONTRACTS = {
  // 桥接相关
  L2SharedBridge: "0x[部署地址]",                    // 通过 RPC 获取
  L2AssetRouter: "0x0000000000000000000000000000000000010003", // 固定地址
  L2NativeTokenVault: "0x0000000000000000000000000000000000010004", // 固定地址
  
  // 基础代币
  L2BaseToken: "0x000000000000000000000000000000000000800A", // 固定地址 (BNB)
  
  // 系统合约
  L2Bootloader: "0x0000000000000000000000000000000000008001",
  L2AccountCodeStorage: "0x0000000000000000000000000000000000008002",
  L2NonceHolder: "0x0000000000000000000000000000000000008003",
  L2KnownCodesStorage: "0x0000000000000000000000000000000000008004",
  L2ImmutableSimulator: "0x0000000000000000000000000000000000008005",
  L2ContractDeployer: "0x0000000000000000000000000000000000008006",
  L2L1Messenger: "0x0000000000000000000000000000000000008008",
  L2EventWriter: "0x0000000000000000000000000000000000008009",
  L2Compressor: "0x000000000000000000000000000000000000800C",
  L2ComplexUpgrader: "0x000000000000000000000000000000000000800F",
  L2Create2Factory: "0x0000000000000000000000000000000000010000",
};
```

## 🔧 BSC zkStack 特定配置

### **代币配置**

```typescript
// BSC zkStack 原生代币配置
const BSC_ZKSTACK_NATIVE_TOKEN = {
  // L2 基础代币 (BNB)
  address: "0x000000000000000000000000000000000000800A", // L2 BNB 地址
  l1Address: "0x0000000000000000000000000000000000000000", // L1 原生 BNB (零地址)
  symbol: "BNB",
  name: "Test BNB",
  decimals: 18,
  iconUrl: "/img/bnb.svg",
};

// 支持的代币列表
const BSC_ZKSTACK_TOKENS = [
  BSC_ZKSTACK_NATIVE_TOKEN,
  // 其他 ERC20 代币可以通过桥接添加
];
```

### **网络兼容性设置**

```typescript
// BSC 网络兼容性配置
const BSC_COMPATIBILITY_CONFIG = {
  // 强制使用传统交易类型
  forceTransactionType: 0,           // 非 EIP-1559
  
  // Gas 配置
  defaultGasPrice: "5000000000",     // 5 gwei
  gasBufferMultiplier: 1.3,          // 130% 缓冲区
  
  // 存款 Gas 限制
  ethDepositGasLimit: 150000,        // ETH 存款
  erc20DepositGasLimit: 300000,      // ERC20 存款
  
  // 提取 Gas 限制
  withdrawalGasLimit: 200000,        // 标准提取
  
  // 完成提取 Gas 限制
  finalizeWithdrawalGasLimit: 300000, // 完成提取
};
```

## 📝 实际获取脚本

### **完整的地址获取脚本**

```typescript
// get-bsc-zkstack-addresses.ts
import { Provider } from "zksync-ethers";
import { ethers } from "ethers";

const BSC_ZKSTACK_RPC = "http://13.228.79.240:3050/";
const BSC_TESTNET_RPC = "http://47.130.24.70:10575";

async function getBscZkStackAddresses() {
  console.log("🔍 获取 BSC zkStack 合约地址...\n");
  
  try {
    // 1. 连接到 BSC zkStack
    const l2Provider = new Provider(BSC_ZKSTACK_RPC);
    const l1Provider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC);
    
    // 2. 验证网络
    const l2Network = await l2Provider.getNetwork();
    const l1Network = await l1Provider.getNetwork();
    
    console.log("📡 网络信息:");
    console.log(`  L2 Chain ID: ${l2Network.chainId} (期望: 9720)`);
    console.log(`  L1 Chain ID: ${l1Network.chainId} (期望: 97)`);
    console.log("");
    
    // 3. 获取桥地址
    const bridgeAddresses = await l2Provider.getDefaultBridgeAddresses();
    
    console.log("🌉 桥接合约地址:");
    console.log(`  L1 Shared Bridge: ${bridgeAddresses.sharedL1}`);
    console.log(`  L2 Shared Bridge: ${bridgeAddresses.sharedL2}`);
    console.log(`  L1 ERC20 Bridge:  ${bridgeAddresses.erc20L1}`);
    console.log(`  L2 ERC20 Bridge:  ${bridgeAddresses.erc20L2}`);
    console.log("");
    
    // 4. 获取基础代币地址
    const baseTokenL1 = await l2Provider.getBaseTokenContractAddress();
    const ethL2Address = await l2Provider.l2TokenAddress("0x0000000000000000000000000000000000000000");
    
    console.log("🪙 代币地址:");
    console.log(`  L1 Base Token: ${baseTokenL1}`);
    console.log(`  L2 ETH Address: ${ethL2Address}`);
    console.log(`  L2 Base Token: 0x000000000000000000000000000000000000800A`);
    console.log("");
    
    // 5. 验证合约存在
    const l1Code = await l1Provider.getCode(bridgeAddresses.sharedL1);
    const l2Code = await l2Provider.getCode(bridgeAddresses.sharedL2);
    
    console.log("✅ 合约验证:");
    console.log(`  L1 Bridge 存在: ${l1Code !== "0x" ? "是" : "否"}`);
    console.log(`  L2 Bridge 存在: ${l2Code !== "0x" ? "是" : "否"}`);
    console.log("");
    
    // 6. 返回完整配置
    return {
      network: {
        l1ChainId: Number(l1Network.chainId),
        l2ChainId: Number(l2Network.chainId),
        l1RpcUrl: BSC_TESTNET_RPC,
        l2RpcUrl: BSC_ZKSTACK_RPC,
      },
      contracts: {
        l1SharedBridge: bridgeAddresses.sharedL1,
        l2SharedBridge: bridgeAddresses.sharedL2,
        l1Erc20Bridge: bridgeAddresses.erc20L1,
        l2Erc20Bridge: bridgeAddresses.erc20L2,
        l1BaseToken: baseTokenL1,
        l2EthAddress: ethL2Address,
        l2BaseToken: "0x000000000000000000000000000000000000800A",
      },
      systemContracts: {
        l2AssetRouter: "0x0000000000000000000000000000000000010003",
        l2NativeTokenVault: "0x0000000000000000000000000000000000010004",
        l2Bootloader: "0x0000000000000000000000000000000000008001",
        l2AccountCodeStorage: "0x0000000000000000000000000000000000008002",
        l2NonceHolder: "0x0000000000000000000000000000000000008003",
        l2ContractDeployer: "0x0000000000000000000000000000000000008006",
        l2L1Messenger: "0x0000000000000000000000000000000000008008",
      }
    };
    
  } catch (error) {
    console.error("❌ 获取地址失败:", error);
    throw error;
  }
}

// 运行脚本
if (require.main === module) {
  getBscZkStackAddresses()
    .then(config => {
      console.log("🎉 BSC zkStack 配置获取成功!");
      console.log("\n📋 完整配置:");
      console.log(JSON.stringify(config, null, 2));
    })
    .catch(error => {
      console.error("💥 脚本执行失败:", error.message);
      process.exit(1);
    });
}

export { getBscZkStackAddresses };
```

## 🚀 使用方法

### **在项目中使用**

```typescript
// 在 zkSync Portal 项目中获取 BSC zkStack 地址
import { getBscZkStackAddresses } from "./get-bsc-zkstack-addresses";

// 在组件或 composable 中使用
const useBscZkStackContracts = () => {
  const [addresses, setAddresses] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    getBscZkStackAddresses()
      .then(setAddresses)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);
  
  return { addresses, loading, error };
};
```

### **验证连接**

```bash
# 测试 BSC zkStack RPC 连接
curl -X POST http://13.228.79.240:3050/ \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_chainId",
    "params": [],
    "id": 1
  }'

# 期望返回: {"jsonrpc":"2.0","id":1,"result":"0x25f8"} (0x25f8 = 9720)

# 获取桥合约地址
curl -X POST http://13.228.79.240:3050/ \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "zks_getBridgeContracts",
    "params": [],
    "id": 1
  }'
```

## 📊 总结

BSC zkStack (Chain ID: 9720) 是一个基于 zkSync 技术栈的 BSC 侧链，具有以下特点：

1. **L2 Chain ID**: `9720`
2. **L1 网络**: BSC Testnet (Chain ID: 97)
3. **原生代币**: BNB (在 L2 上地址为 `0x000000000000000000000000000000000000800A`)
4. **桥接架构**: 使用 zkSync 标准的 Shared Bridge 架构
5. **系统合约**: 使用标准的 zkSync L2 系统合约地址

要获取具体的桥合约地址，需要通过 RPC 调用 `zks_getBridgeContracts` 方法或使用 zkSync Provider 的 `getDefaultBridgeAddresses()` 方法。