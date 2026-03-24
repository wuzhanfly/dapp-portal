const { ethers } = require('ethers');

// From error: totalFee = 0.00036725 BNB
const totalFee = ethers.parseEther('0.00036725');
console.log('Total Fee:', totalFee.toString(), 'wei');

// Current gas price: 0.1 gwei
const gasPrice = ethers.parseUnits('0.1', 'gwei');
console.log('Gas Price:', gasPrice.toString(), 'wei');

// With 130% buffer
const bufferedGasPrice = (gasPrice * 130n) / 100n;
console.log('Buffered Gas Price:', bufferedGasPrice.toString(), 'wei');
console.log('Buffered Gas Price:', ethers.formatUnits(bufferedGasPrice, 'gwei'), 'gwei');

// L1 gas limit for Base Token: 250000 (from code)
const l1GasLimit = 250000n;
console.log('\nL1 Gas Limit:', l1GasLimit.toString());

// With 130% buffer
const bufferedL1GasLimit = (l1GasLimit * 130n) / 100n;
console.log('Buffered L1 Gas Limit:', bufferedL1GasLimit.toString());

// Calculate L1 gas fee
const l1GasFee = bufferedL1GasLimit * bufferedGasPrice;
console.log('\nL1 Gas Fee:', l1GasFee.toString(), 'wei');
console.log('L1 Gas Fee:', ethers.formatEther(l1GasFee), 'BNB');

// Calculate baseCost
const l2GasLimit = 1000000n;
const l2GasPerPubdata = 800n;
const baseCost = l2GasLimit * gasPrice + l2GasPerPubdata * 0n;
console.log('\nBase Cost:', baseCost.toString(), 'wei');
console.log('Base Cost:', ethers.formatEther(baseCost), 'BNB');

// With 130% buffer
const bufferedBaseCost = (baseCost * 130n) / 100n;
console.log('Buffered Base Cost:', bufferedBaseCost.toString(), 'wei');
console.log('Buffered Base Cost:', ethers.formatEther(bufferedBaseCost), 'BNB');

// Total
const calculatedTotal = l1GasFee + bufferedBaseCost;
console.log('\nCalculated Total:', calculatedTotal.toString(), 'wei');
console.log('Calculated Total:', ethers.formatEther(calculatedTotal), 'BNB');

console.log('\nMatch with displayed fee:', calculatedTotal === totalFee ? 'YES' : 'NO');
