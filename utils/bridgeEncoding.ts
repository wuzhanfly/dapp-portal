import { type Address, encodeAbiParameters, keccak256, concat } from "viem";

/**
 * L2 Native Token Vault address (constant across all chains)
 */
export const L2_NATIVE_TOKEN_VAULT_ADDRESS = "0x0000000000000000000000000000000000010004" as Address;

/**
 * Encode Native Token Vault transfer data
 * @param amount - Amount of tokens to transfer
 * @param receiver - Address that will receive the tokens
 * @param token - Address of the token being transferred
 * @returns ABI-encoded transfer data
 */
export function encodeNativeTokenVaultTransferData(
  amount: bigint,
  receiver: Address,
  token: Address
): `0x${string}` {
  return encodeAbiParameters(
    [{ type: "uint256" }, { type: "address" }, { type: "address" }],
    [amount, receiver, token]
  );
}

/**
 * Encode asset transfer data for BridgeHub contract using v1 encoding scheme
 * @param assetId - Encoded token asset ID
 * @param transferData - Encoded transfer data from encodeNativeTokenVaultTransferData
 * @returns Encoded second bridge data with v1 prefix
 */
export function encodeSecondBridgeDataV1(assetId: `0x${string}`, transferData: `0x${string}`): `0x${string}` {
  const data = encodeAbiParameters([{ type: "bytes32" }, { type: "bytes" }], [assetId, transferData]);

  // Prepend version byte (0x01 for v1)
  return concat(["0x01", data]);
}

/**
 * Encode NTV (Native Token Vault) asset ID
 * @param chainId - L1 chain ID
 * @param tokenAddress - Token address on L1
 * @returns Asset ID as bytes32
 */
export function encodeNTVAssetId(chainId: bigint, tokenAddress: Address): `0x${string}` {
  const encoded = encodeAbiParameters(
    [{ type: "uint256" }, { type: "address" }, { type: "address" }],
    [chainId, L2_NATIVE_TOKEN_VAULT_ADDRESS, tokenAddress]
  );

  return keccak256(encoded);
}

/**
 * Generate complete second bridge calldata for ERC20 token deposit
 * @param l1ChainId - L1 chain ID (e.g., 97 for BSC Testnet)
 * @param tokenAddress - Token address on L1
 * @param amount - Amount to deposit
 * @param receiver - Receiver address on L2
 * @returns Complete second bridge calldata
 */
export function generateSecondBridgeCalldata(
  l1ChainId: bigint,
  tokenAddress: Address,
  amount: bigint,
  receiver: Address
): `0x${string}` {
  // 1. Calculate asset ID
  const assetId = encodeNTVAssetId(l1ChainId, tokenAddress);

  // 2. Encode transfer data
  const transferData = encodeNativeTokenVaultTransferData(amount, receiver, tokenAddress);

  // 3. Encode second bridge data with v1 prefix
  return encodeSecondBridgeDataV1(assetId, transferData);
}
