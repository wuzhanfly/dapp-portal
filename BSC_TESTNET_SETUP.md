# BSC Testnet zkStack 配置指南

## 🎯 配置概述

已成功配置 ZKsync Portal 以支持你的 BSC Testnet L1 部署的 zkStack 项目。

## 📋 配置详情

### **网络信息**
- **L2 Chain ID**: 9720
- **L2 Network Key**: `zk_bsc_chain`
- **L2 Network Name**: ZK BSC Chain
- **L2 RPC URL**: `http://13.228.79.240:3050/`
- **L2 Block Explorer**: `http://54.255.170.191:3010/`
- **L2 Block Explorer API**: `http://54.255.170.191:3002`

### **L1 网络配置**
- **L1 Chain ID**: 97 (BSC Testnet)
- **L1 Network Name**: BSC Testnet
- **L1 RPC URL**: `http://47.130.24.70:10575`
- **L1 Block Explorer**: `https://testnet.bscscan.com`

### **代币配置**
- **Native Token**: Test BNB (BNB)
- **L2 Address**: `0x000000000000000000000000000000000000800A`
- **L1 Address**: `0x0000000000000000000000000000000000000000`
- **Decimals**: 18

## 🔧 已完成的配置更改

### 1. **Hyperchain 配置** (`hyperchains/config.json`)
```json
{
  "network": {
    "id": 9720,
    "key": "zk_bsc_chain",
    "name": "ZK BSC Chain",
    "rpcUrl": "http://13.228.79.240:3050/",
    "blockExplorerUrl": "http://54.255.170.191:3010/",
    "blockExplorerApi": "http://54.255.170.191:3002",
    "l1Network": {
      "id": 97,
      "name": "BSC Testnet",
      "rpcUrls": {
        "default": {"http": ["http://47.130.24.70:10575"]}
      }
    }
  },
  "tokens": [
    {
      "address": "0x000000000000000000000000000000000000800A",
      "symbol": "BNB",
      "name": "Test BNB",
      "decimals": 18
    }
  ]
}
```

### 2. **网络配置更新** (`data/networks.ts`)
- 更新了 BSC 网络配置，使用正确的 L1 网络信息
- 添加了 BSC Testnet 作为 L1 网络支持
- 配置了 tBNB 作为原生代币

### 3. **余额查询支持** (`store/ethereumBalance.ts`)
- 添加了 BSC Testnet (Chain ID: 97) 的 Ankr 支持
- 支持通过 Ankr API 查询 BSC Testnet 余额

### 4. **UI 资源**
- 创建了 BNB 图标 (`public/img/bnb.svg`)
- 配置了代币显示图标

## 🚀 启动项目

### **开发模式启动**
```bash
# 启动 Hyperchain 模式
npm run dev:node:hyperchain

# 或者直接设置环境变量
NODE_TYPE=hyperchain npm run dev
```

### **✅ 项目状态**
- 🟢 **当前状态**: 项目已成功启动并运行
- 🌐 **访问地址**: http://localhost:3000/ (HTTP 200 OK)
- 📊 **监控**: 文件监听器限制已解决 (524288)
- ⚡ **性能**: Nuxt 3.16.2 + Nitro 2.11.9 运行正常
- 🔧 **配置**: BSC Testnet L1 + ZK BSC Chain L2 完全配置
- 💰 **费用估算**: BSC EIP-1559 兼容性问题已修复

### **生产构建**
```bash
# 构建 Hyperchain 版本
npm run generate:node:hyperchain
```

## 🔍 验证配置

启动项目后，你应该能看到：

1. **网络选择器**中显示 "ZK BSC Chain"
2. **钱包连接**时自动切换到 BSC Testnet (Chain ID: 97)
3. **代币余额**显示 tBNB
4. **跨链桥**功能支持 BSC Testnet ↔ ZK BSC Chain

## ⚠️ 注意事项

### **系统要求**
- ✅ **已解决文件监听器限制问题**：
  ```bash
  # 已执行：增加文件监听器限制到 524288
  sudo sysctl fs.inotify.max_user_watches=524288
  echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
  ```
  
- **验证配置**：
  ```bash
  cat /proc/sys/fs/inotify/max_user_watches
  # 应该显示: 524288
  ```

### **网络连接**
- 确保能访问你的 L1 RPC: `http://47.130.24.70:10575`
- 确保能访问你的 L2 RPC: `http://13.228.79.240:3050`
- 确保能访问区块浏览器: `http://54.255.170.191:3010/`

### **钱包配置**
用户需要在钱包中添加 BSC Testnet 网络：
- **Network Name**: BSC Testnet
- **RPC URL**: `http://47.130.24.70:10575`
- **Chain ID**: 97
- **Currency Symbol**: tBNB
- **Block Explorer**: https://testnet.bscscan.com

## 🛠️ 故障排除

### **已修复的问题**

1. **✅ API URL 双斜杠问题**
   - **问题**: `Getting tokens error: [GET] "http://54.255.170.191:3002//tokens": 404 Not Found`
   - **原因**: `blockExplorerApi` URL 末尾多了斜杠
   - **修复**: 移除 URL 末尾的斜杠
   - **状态**: 已修复，API 现在返回 200 OK

2. **✅ BSC EIP-1559 兼容性问题**
   - **问题**: `Fee estimation error: Cannot convert null to a BigInt`
   - **原因**: BSC 网络的 EIP-1559 实现返回 `baseFeePerGas: 0x0`，导致费用计算时出现 null 值
   - **修复**: 为 BSC 网络添加特殊的费用处理逻辑和 null 值检查
   - **技术细节**: 
     - BSC Testnet (Chain ID: 97) 优先使用 legacy gas price
     - 添加了完整的 null 值检查和错误处理
     - 以太坊网络优先使用 EIP-1559，失败时回退到 legacy 模式
     - 所有 gas 估算都添加了 null 值保护
   - **验证**: 
     ```bash
     # BSC Testnet gas price 正常返回
     curl -X POST -H "Content-Type: application/json" \
       --data '{"jsonrpc":"2.0","method":"eth_gasPrice","params":[],"id":1}' \
       http://47.130.24.70:10575
     # 返回: {"jsonrpc":"2.0","id":1,"result":"0x5f5e100"}
     ```
   - **状态**: 已修复，费用估算现在完全支持 BSC 网络

3. **✅ BSC Deposit 费用估算 BigInt 转换问题**
   - **问题**: `Fee estimation error: Cannot convert null to a BigInt`
   - **根本原因**: 
     - BSC 网络 EIP-1559 实现不完整，返回 null 值
     - zksync-ethers 库期望完整的 EIP-1559 数据结构
     - BSC 的 `baseFeePerGas` 始终为 0，导致计算异常
   - **完整修复方案**:
     - **BSC 网络检测**: 自动识别 Chain ID 97 (BSC Testnet)
     - **强制 Legacy 模式**: 使用 `type: 0` 交易类型
     - **Fallback 机制**: 为所有可能的 null 值提供备用方案
     - **增强错误处理**: 完整的 null 检查和 Sentry 错误报告
     - **BSC 优化**: 对 BSC 网络使用 ERC20 费用结构
   - **技术实现**:
     ```typescript
     // 强制 Legacy 交易类型
     const overrides = {
       type: 0, // Force legacy transaction type
       gasPrice: fee.gasPrice,
       maxFeePerGas: undefined,
       maxPriorityFeePerGas: undefined,
     }
     
     // BSC 网络特殊处理
     if (isBscNetwork.value) {
       fee.value = getERC20TransactionFee() // 使用简化费用结构
     }
     ```
   - **状态**: ✅ 已完全修复，Deposit 功能在 BSC 网络正常工作

### **常见问题**

1. **网络不显示**
   - 检查 `hyperchains/config.json` 配置是否正确
   - 确认 `NODE_TYPE=hyperchain` 环境变量已设置

2. **RPC 连接失败**
   - 验证 RPC URL 是否可访问
   - 检查防火墙和网络配置

3. **余额不显示**
   - 确认 Ankr token 配置（如果使用）
   - 检查 L1 网络连接

4. **跨链桥问题**
   - 验证 L1 和 L2 网络配置
   - 检查合约地址配置

## 📞 技术支持

如果遇到问题，请检查：
1. 网络配置文件是否正确
2. RPC 端点是否可访问
3. 环境变量是否正确设置
4. 系统资源是否充足

配置完成！你的 ZKsync Portal 现在已经支持 BSC Testnet 作为 L1 的 zkStack 部署。