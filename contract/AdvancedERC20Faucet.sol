// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title AdvancedERC20Faucet
 * @dev 高级ERC20水龙头合约，具备防滥用机制
 * @notice 用于向用户分发指定ERC20代币，每个地址有冷却时间和领取次数限制
 */
contract AdvancedERC20Faucet is Ownable, ReentrancyGuard {
    // ====================== 状态变量 ======================
    
    // 目标ERC20代币合约（不可变，部署后无法更改）
    address public immutable tokenContract;
    
    // 单次领取数量（基于代币的小数位数）
    uint256 public amountPerClaim;
    
    // 冷却时间（秒）
    uint256 public claimCooldown;
    
    // 每个地址最大领取次数
    uint256 public maxClaimsPerAddress;
    
    // 领取记录
    struct ClaimRecord {
        uint256 lastClaimTime;    // 上次领取时间
        uint256 totalClaims;      // 总领取次数
        uint256 totalAmount;      // 总领取数量
    }
    
    // 地址到领取记录的映射
    mapping(address => ClaimRecord) public claimRecords;
    
    // 白名单功能（可选）
    mapping(address => bool) public whitelist;
    bool public whitelistEnabled;
    
    // 合约总统计数据
    uint256 public totalDistributed;
    uint256 public totalClaimers;
    
    // ====================== 事件 ======================
    
    event TokensClaimed(address indexed user, uint256 amount, uint256 timestamp);
    event AmountPerClaimUpdated(uint256 oldAmount, uint256 newAmount);
    event CooldownUpdated(uint256 oldCooldown, uint256 newCooldown);
    event MaxClaimsUpdated(uint256 oldMax, uint256 newMax);
    event WhitelistToggled(bool enabled);
    event WhitelistAddressAdded(address indexed user);
    event WhitelistAddressRemoved(address indexed user);
    event TokensWithdrawn(uint256 amount, address indexed recipient);
    event EmergencyWithdrawn(uint256 amount, address indexed owner);
    
    // ====================== 构造函数 ======================
    
    /**
     * @dev 初始化水龙头合约
     * @param _tokenAddress ERC20代币合约地址
     * @param _amountPerClaim 单次领取数量（考虑代币小数位）
     * @param _cooldown 冷却时间（秒）
     * @param _maxClaims 每个地址最大领取次数
     */
    constructor(
        address _tokenAddress,
        uint256 _amountPerClaim,
        uint256 _cooldown,
        uint256 _maxClaims,
        address _initialOwner  // 添加所有者参数
    ) Ownable(_initialOwner) {  // 传递所有者给 Ownable 构造函数
        require(_tokenAddress != address(0), "Token address cannot be zero");
        require(_amountPerClaim > 0, "Amount per claim must be > 0");
        require(_initialOwner != address(0), "Owner address cannot be zero");
        
        tokenContract = _tokenAddress;
        amountPerClaim = _amountPerClaim;
        claimCooldown = _cooldown;
        maxClaimsPerAddress = _maxClaims;
        whitelistEnabled = false; // 默认关闭白名单
    }
    
    // ====================== 核心功能 ======================
    
    /**
     * @dev 领取代币
     * @notice 用户调用此函数领取代币，受冷却时间和领取次数限制
     */
    function claimTokens() external nonReentrant {
        address user = msg.sender;
        
        // 检查白名单（如果启用）
        if (whitelistEnabled) {
            require(whitelist[user], "Address not in whitelist");
        }
        
        ClaimRecord storage record = claimRecords[user];
        
        // 检查是否达到最大领取次数
        require(record.totalClaims < maxClaimsPerAddress, "Max claims reached");
        
        // 检查冷却时间
        if (record.lastClaimTime > 0) {
            require(
                block.timestamp >= record.lastClaimTime + claimCooldown,
                "Cooldown period not passed"
            );
        }
        
        // 检查合约余额是否充足
        uint256 contractBalance = IERC20(tokenContract).balanceOf(address(this));
        require(contractBalance >= amountPerClaim, "Insufficient faucet balance");
        
        // 如果是第一次领取，增加领取者计数
        if (record.totalClaims == 0) {
            totalClaimers++;
        }
        
        // 更新领取记录
        record.lastClaimTime = block.timestamp;
        record.totalClaims++;
        record.totalAmount += amountPerClaim;
        
        // 更新总分发量
        totalDistributed += amountPerClaim;
        
        // 转账代币给用户
        bool success = IERC20(tokenContract).transfer(user, amountPerClaim);
        require(success, "Token transfer failed");
        
        emit TokensClaimed(user, amountPerClaim, block.timestamp);
    }
    
    // ====================== 查询功能 ======================
    
    /**
     * @dev 检查用户是否可以领取
     * @param user 要检查的用户地址
     * @return canClaim 是否可以领取
     * @return timeRemaining 剩余冷却时间（如果还在冷却中）
     */
    function canUserClaim(address user) external view returns (bool canClaim, uint256 timeRemaining) {
        ClaimRecord memory record = claimRecords[user];
        
        // 检查是否达到最大领取次数
        if (record.totalClaims >= maxClaimsPerAddress) {
            return (false, 0);
        }
        
        // 检查白名单
        if (whitelistEnabled && !whitelist[user]) {
            return (false, 0);
        }
        
        // 检查冷却时间
        if (record.lastClaimTime > 0) {
            if (block.timestamp < record.lastClaimTime + claimCooldown) {
                timeRemaining = record.lastClaimTime + claimCooldown - block.timestamp;
                return (false, timeRemaining);
            }
        }
        
        // 检查合约余额
        uint256 contractBalance = IERC20(tokenContract).balanceOf(address(this));
        if (contractBalance < amountPerClaim) {
            return (false, 0);
        }
        
        return (true, 0);
    }
    
    /**
     * @dev 获取用户领取信息
     */
    function getUserClaimInfo(address user) external view returns (
        uint256 lastClaimTime,
        uint256 totalClaims,
        uint256 totalAmount,
        uint256 nextAvailableClaim,
        bool isEligible
    ) {
        ClaimRecord memory record = claimRecords[user];
        lastClaimTime = record.lastClaimTime;
        totalClaims = record.totalClaims;
        totalAmount = record.totalAmount;
        
        if (record.lastClaimTime > 0) {
            nextAvailableClaim = record.lastClaimTime + claimCooldown;
        }
        
        // 检查是否可领取
        (isEligible, ) = this.canUserClaim(user);
    }
    
    /**
     * @dev 获取水龙头合约的ERC20代币余额
     */
    function getFaucetBalance() external view returns (uint256) {
        return IERC20(tokenContract).balanceOf(address(this));
    }
    
    /**
     * @dev 获取合约统计信息
     */
    function getStats() external view returns (
        uint256 distributed,
        uint256 claimers,
        uint256 faucetBalance,
        uint256 perClaimAmount
    ) {
        distributed = totalDistributed;
        claimers = totalClaimers;
        faucetBalance = IERC20(tokenContract).balanceOf(address(this));
        perClaimAmount = amountPerClaim;
    }
    
    // ====================== 管理员功能 ======================
    
    /**
     * @dev 设置单次领取数量（仅所有者）
     */
    function setAmountPerClaim(uint256 newAmount) external onlyOwner {
        require(newAmount > 0, "Amount must be > 0");
        uint256 oldAmount = amountPerClaim;
        amountPerClaim = newAmount;
        emit AmountPerClaimUpdated(oldAmount, newAmount);
    }
    
    /**
     * @dev 设置冷却时间（仅所有者）
     */
    function setCooldown(uint256 newCooldown) external onlyOwner {
        uint256 oldCooldown = claimCooldown;
        claimCooldown = newCooldown;
        emit CooldownUpdated(oldCooldown, newCooldown);
    }
    
    /**
     * @dev 设置最大领取次数（仅所有者）
     */
    function setMaxClaims(uint256 newMax) external onlyOwner {
        uint256 oldMax = maxClaimsPerAddress;
        maxClaimsPerAddress = newMax;
        emit MaxClaimsUpdated(oldMax, newMax);
    }
    
    /**
     * @dev 切换白名单模式（仅所有者）
     */
    function toggleWhitelist(bool enabled) external onlyOwner {
        whitelistEnabled = enabled;
        emit WhitelistToggled(enabled);
    }
    
    /**
     * @dev 添加地址到白名单（仅所有者）
     */
    function addToWhitelist(address[] calldata users) external onlyOwner {
        for (uint256 i = 0; i < users.length; i++) {
            whitelist[users[i]] = true;
            emit WhitelistAddressAdded(users[i]);
        }
    }
    
    /**
     * @dev 从白名单移除地址（仅所有者）
     */
    function removeFromWhitelist(address[] calldata users) external onlyOwner {
        for (uint256 i = 0; i < users.length; i++) {
            whitelist[users[i]] = false;
            emit WhitelistAddressRemoved(users[i]);
        }
    }
    
    /**
     * @dev 向水龙头合约充值代币（任何人都可以调用）
     */
    function fundFaucet(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        bool success = IERC20(tokenContract).transferFrom(msg.sender, address(this), amount);
        require(success, "Transfer failed");
    }
    
    /**
     * @dev 提取代币到指定地址（仅所有者，用于回收多余代币）
     */
    function withdrawTokens(uint256 amount, address recipient) external onlyOwner {
        require(amount > 0, "Amount must be > 0");
        require(recipient != address(0), "Recipient cannot be zero");
        
        uint256 balance = IERC20(tokenContract).balanceOf(address(this));
        require(balance >= amount, "Insufficient balance");
        
        bool success = IERC20(tokenContract).transfer(recipient, amount);
        require(success, "Transfer failed");
        
        emit TokensWithdrawn(amount, recipient);
    }
    
    /**
     * @dev 紧急提取所有代币（仅所有者）
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = IERC20(tokenContract).balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        
        bool success = IERC20(tokenContract).transfer(owner(), balance);
        require(success, "Transfer failed");
        
        emit EmergencyWithdrawn(balance, owner());
    }
}