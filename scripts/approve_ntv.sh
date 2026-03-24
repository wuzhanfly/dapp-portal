#!/bin/bash

# WBNB 授权给 NativeTokenVault
# 使用方法: ./scripts/approve_ntv.sh

WBNB="0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd"
NTV="0xa37b3cf61ed8b3e6740271e7a517fecc15920781"
RPC="https://bsc-testnet.bnbchain.org"

echo "=== Approving WBNB to NativeTokenVault ==="
echo "WBNB: $WBNB"
echo "NativeTokenVault: $NTV"
echo ""

# 最大授权额度
MAX_UINT256="115792089237316195423570985008687907853269984665640564039457584007913129639935"

echo "Please approve this transaction in your wallet..."
echo ""

# 使用 cast 发送交易
cast send $WBNB \
  "approve(address,uint256)" \
  $NTV \
  $MAX_UINT256 \
  --rpc-url $RPC \
  --legacy

echo ""
echo "✓ Approval transaction sent!"
echo "You can now deposit WBNB on the bridge."
