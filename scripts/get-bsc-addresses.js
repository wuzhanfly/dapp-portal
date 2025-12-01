#!/usr/bin/env node

/**
 * 获取 BSC zkStack (Chain ID: 9720) 的实际合约地址
 *
 * 使用方法:
 * node scripts/get-bsc-addresses.js
 */

const http = require("http");
const https = require("https");

// BSC zkStack 网络配置
const BSC_ZKSTACK_RPC = "http://13.228.79.240:3050";
const BSC_TESTNET_RPC = "http://47.130.24.70:10575";

// RPC 调用函数
function makeRpcCall(url, method, params = []) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      jsonrpc: "2.0",
      method,
      params,
      id: 1,
    });

    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": data.length,
      },
    };

    const client = urlObj.protocol === "https:" ? https : http;

    const req = client.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        try {
          const parsed = JSON.parse(responseData);
          if (parsed.error) {
            reject(new Error(`RPC Error: ${parsed.error.message}`));
          } else {
            resolve(parsed.result);
          }
        } catch (error) {
          reject(new Error(`Parse Error: ${error.message}`));
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// 获取 BSC zkStack 合约地址
async function getBscZkStackAddresses() {
  console.log("🔍 获取 BSC zkStack (Chain ID: 9720) 合约地址...\n");

  try {
    // 1. 验证 L2 网络 (BSC zkStack)
    console.log("📡 验证 L2 网络连接...");
    const l2ChainId = await makeRpcCall(BSC_ZKSTACK_RPC, "eth_chainId");
    const l2ChainIdDecimal = parseInt(l2ChainId, 16);
    console.log(`  L2 Chain ID: ${l2ChainIdDecimal} (0x${l2ChainIdDecimal.toString(16)})`);

    if (l2ChainIdDecimal !== 9720) {
      throw new Error(`期望 Chain ID 9720，实际获得 ${l2ChainIdDecimal}`);
    }

    // 2. 验证 L1 网络 (BSC Testnet)
    console.log("📡 验证 L1 网络连接...");
    const l1ChainId = await makeRpcCall(BSC_TESTNET_RPC, "eth_chainId");
    const l1ChainIdDecimal = parseInt(l1ChainId, 16);
    console.log(`  L1 Chain ID: ${l1ChainIdDecimal} (0x${l1ChainIdDecimal.toString(16)})`);

    if (l1ChainIdDecimal !== 97) {
      console.warn(`⚠️  期望 L1 Chain ID 97，实际获得 ${l1ChainIdDecimal}`);
    }

    // 3. 获取桥合约地址
    console.log("\n🌉 获取桥接合约地址...");
    const bridgeContracts = await makeRpcCall(BSC_ZKSTACK_RPC, "zks_getBridgeContracts");

    console.log("  桥接合约:");
    console.log(`    L1 Shared Bridge:     ${bridgeContracts.l1SharedDefaultBridge || "N/A"}`);
    console.log(`    L2 Shared Bridge:     ${bridgeContracts.l2SharedDefaultBridge || "N/A"}`);
    console.log(`    L1 ERC20 Bridge:      ${bridgeContracts.l1Erc20DefaultBridge || "N/A"}`);
    console.log(`    L2 ERC20 Bridge:      ${bridgeContracts.l2Erc20DefaultBridge || "N/A"}`);

    // 4. 获取基础代币信息
    console.log("\n🪙 获取代币地址...");

    try {
      // 获取 L1 基础代币地址
      const baseTokenL1 = await makeRpcCall(BSC_ZKSTACK_RPC, "zks_getBaseTokenL1Address");
      console.log(`  L1 Base Token:        ${baseTokenL1 || "0x0000000000000000000000000000000000000000"}`);
    } catch (error) {
      console.log("  L1 Base Token:        0x0000000000000000000000000000000000000000 (默认)");
    }

    // L2 系统合约地址 (固定)
    console.log("  L2 Base Token:        0x000000000000000000000000000000000000800A");
    console.log("  L2 Asset Router:      0x0000000000000000000000000000000000010003");
    console.log("  L2 Native Token Vault: 0x0000000000000000000000000000000000010004");

    // 5. 验证合约存在性
    console.log("\n✅ 验证合约部署状态...");

    if (bridgeContracts.l1SharedDefaultBridge) {
      try {
        const l1Code = await makeRpcCall(BSC_TESTNET_RPC, "eth_getCode", [
          bridgeContracts.l1SharedDefaultBridge,
          "latest",
        ]);
        console.log(`  L1 Shared Bridge:     ${l1Code !== "0x" ? "✅ 已部署" : "❌ 未部署"}`);
      } catch (error) {
        console.log(`  L1 Shared Bridge:     ❓ 无法验证 (${error.message})`);
      }
    }

    if (bridgeContracts.l2SharedDefaultBridge) {
      try {
        const l2Code = await makeRpcCall(BSC_ZKSTACK_RPC, "eth_getCode", [
          bridgeContracts.l2SharedDefaultBridge,
          "latest",
        ]);
        console.log(`  L2 Shared Bridge:     ${l2Code !== "0x" ? "✅ 已部署" : "❌ 未部署"}`);
      } catch (error) {
        console.log(`  L2 Shared Bridge:     ❓ 无法验证 (${error.message})`);
      }
    }

    // 6. 获取网络状态
    console.log("\n📊 网络状态信息...");

    try {
      const l2BlockNumber = await makeRpcCall(BSC_ZKSTACK_RPC, "eth_blockNumber");
      console.log(`  L2 最新区块:          ${parseInt(l2BlockNumber, 16)}`);
    } catch (error) {
      console.log("  L2 最新区块:          无法获取");
    }

    try {
      const l1BlockNumber = await makeRpcCall(BSC_TESTNET_RPC, "eth_blockNumber");
      console.log(`  L1 最新区块:          ${parseInt(l1BlockNumber, 16)}`);
    } catch (error) {
      console.log("  L1 最新区块:          无法获取");
    }

    // 7. 生成配置对象
    const config = {
      network: {
        l1: {
          chainId: l1ChainIdDecimal,
          name: "BSC Testnet",
          rpcUrl: BSC_TESTNET_RPC,
          blockExplorer: "https://testnet.bscscan.com",
        },
        l2: {
          chainId: l2ChainIdDecimal,
          name: "ZK BSC Chain",
          rpcUrl: BSC_ZKSTACK_RPC,
          blockExplorer: "http://54.255.170.191:3010",
        },
      },
      contracts: {
        bridges: {
          l1SharedBridge: bridgeContracts.l1SharedDefaultBridge,
          l2SharedBridge: bridgeContracts.l2SharedDefaultBridge,
          l1Erc20Bridge: bridgeContracts.l1Erc20DefaultBridge,
          l2Erc20Bridge: bridgeContracts.l2Erc20DefaultBridge,
        },
        tokens: {
          l1BaseToken: "0x0000000000000000000000000000000000000000", // BNB
          l2BaseToken: "0x000000000000000000000000000000000000800A", // L2 BNB
        },
        system: {
          l2AssetRouter: "0x0000000000000000000000000000000000010003",
          l2NativeTokenVault: "0x0000000000000000000000000000000000010004",
          l2Bootloader: "0x0000000000000000000000000000000000008001",
          l2AccountCodeStorage: "0x0000000000000000000000000000000000008002",
          l2NonceHolder: "0x0000000000000000000000000000000000008003",
          l2ContractDeployer: "0x0000000000000000000000000000000000008006",
          l2L1Messenger: "0x0000000000000000000000000000000000008008",
        },
      },
      timestamp: new Date().toISOString(),
    };

    console.log("\n🎉 BSC zkStack 地址获取完成!");
    console.log("\n📋 完整配置 (JSON):");
    console.log("=".repeat(80));
    console.log(JSON.stringify(config, null, 2));
    console.log("=".repeat(80));

    return config;
  } catch (error) {
    console.error(`\n❌ 获取地址失败: ${error.message}`);
    console.error("\n🔧 故障排除建议:");
    console.error("  1. 检查网络连接");
    console.error("  2. 验证 RPC 端点是否可访问:");
    console.error(`     - L2: ${BSC_ZKSTACK_RPC}`);
    console.error(`     - L1: ${BSC_TESTNET_RPC}`);
    console.error("  3. 确认 BSC zkStack 网络正在运行");
    console.error("  4. 检查防火墙设置");

    throw error;
  }
}

// 主函数
async function main() {
  try {
    await getBscZkStackAddresses();
    process.exit(0);
  } catch (error) {
    console.error(`\n💥 脚本执行失败: ${error.message}`);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { getBscZkStackAddresses };
