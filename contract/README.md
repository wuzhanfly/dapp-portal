# Smart Contracts

This directory contains smart contracts and their ABIs used in the dApp Portal.

## AdvancedERC20Faucet

**Contract Address:** `0xbd82c02831226b0cFD91Ce7A352056B41Ad364b0` (BSC Testnet)

### Overview

An advanced ERC20 token faucet with anti-abuse mechanisms including:
- Cooldown period between claims
- Maximum claims per address limit
- Optional whitelist functionality
- Admin controls for configuration

### Files

- `AdvancedERC20Faucet.sol` - Solidity source code
- `AdvancedERC20FaucetABI.json` - Contract ABI for frontend integration

### Key Features

#### User Functions

- `claimTokens()` - Claim tokens from the faucet
- `canUserClaim(address)` - Check if an address can claim
- `getUserClaimInfo(address)` - Get user's claim history
- `getFaucetBalance()` - Get faucet's token balance
- `getStats()` - Get overall faucet statistics

#### Admin Functions (Owner Only)

- `setAmountPerClaim(uint256)` - Set amount per claim
- `setCooldown(uint256)` - Set cooldown period in seconds
- `setMaxClaims(uint256)` - Set maximum claims per address
- `toggleWhitelist(bool)` - Enable/disable whitelist mode
- `addToWhitelist(address[])` - Add addresses to whitelist
- `removeFromWhitelist(address[])` - Remove addresses from whitelist
- `withdrawTokens(uint256, address)` - Withdraw tokens from faucet
- `emergencyWithdraw()` - Emergency withdraw all tokens

#### Public Functions

- `fundFaucet(uint256)` - Anyone can fund the faucet

### Events

- `TokensClaimed(address indexed user, uint256 amount, uint256 timestamp)`
- `AmountPerClaimUpdated(uint256 oldAmount, uint256 newAmount)`
- `CooldownUpdated(uint256 oldCooldown, uint256 newCooldown)`
- `MaxClaimsUpdated(uint256 oldMax, uint256 newMax)`
- `WhitelistToggled(bool enabled)`
- `WhitelistAddressAdded(address indexed user)`
- `WhitelistAddressRemoved(address indexed user)`
- `TokensWithdrawn(uint256 amount, address indexed recipient)`
- `EmergencyWithdrawn(uint256 amount, address indexed owner)`

### Deployment Parameters

```solidity
constructor(
    address _tokenAddress,      // ERC20 token contract address
    uint256 _amountPerClaim,    // Amount per claim (with decimals)
    uint256 _cooldown,          // Cooldown period in seconds
    uint256 _maxClaims,         // Maximum claims per address
    address _initialOwner       // Contract owner address
)
```

### Current Configuration (BSC Testnet)

- **Token:** MAC Token (`0x68da710056e0491B436c5ef6A1DFB246b2E882bC`)
- **Amount per Claim:** Check contract state
- **Cooldown:** Check contract state
- **Max Claims:** Check contract state
- **Network:** BSC Testnet (Chain ID: 97)

### Security Features

1. **ReentrancyGuard** - Prevents reentrancy attacks
2. **Ownable** - Access control for admin functions
3. **Cooldown Mechanism** - Prevents rapid repeated claims
4. **Claim Limit** - Prevents single address abuse
5. **Whitelist** - Optional access control

### Integration

See [FAUCET_INTEGRATION.md](../FAUCET_INTEGRATION.md) for frontend integration details.

### Testing

To test the faucet:

1. Connect wallet to BSC Testnet
2. Navigate to `/faucet` page
3. Click "Claim Tokens"
4. Confirm transaction in wallet
5. Wait for transaction confirmation

### Maintenance

#### Funding the Faucet

```javascript
// Approve tokens first
await tokenContract.approve(faucetAddress, amount);

// Fund the faucet
await faucetContract.fundFaucet(amount);
```

#### Checking Balance

```javascript
const balance = await faucetContract.getFaucetBalance();
```

#### Updating Configuration

```javascript
// Set new amount per claim (owner only)
await faucetContract.setAmountPerClaim(newAmount);

// Set new cooldown (owner only)
await faucetContract.setCooldown(newCooldownInSeconds);

// Set new max claims (owner only)
await faucetContract.setMaxClaims(newMaxClaims);
```

### Links

- [Contract on BSCScan](https://testnet.bscscan.com/address/0xbd82c02831226b0cFD91Ce7A352056B41Ad364b0)
- [MAC Token on BSCScan](https://testnet.bscscan.com/token/0x68da710056e0491B436c5ef6A1DFB246b2E882bC)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

### License

MIT License
