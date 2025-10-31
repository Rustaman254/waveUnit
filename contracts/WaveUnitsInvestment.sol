// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IHederaTokenService {
    function associateToken(address account, address token) external returns (int responseCode);
    function transferToken(address token, address sender, address recipient, int64 amount) external returns (int responseCode);
    function mintToken(address token, int64 amount, bytes[] memory metadata) external returns (int responseCode, int64 newTotalSupply, int64[] memory serialNumbers);
}

contract WaveUnitsInvestment {
    address public owner;
    address public hensTokenAddress;
    address public treasuryAccount;

    uint256 public henPriceInKsh = 700;
    uint256 public bonusPercentage = 5;
    uint256 public lockPeriodDays = 3;

    struct Investment {
        uint256 amountKsh;
        uint256 baseShares;
        uint256 bonusShares;
        uint256 totalShares;
        uint256 timestamp;
        uint256 lockedUntil;
        bool active;
    }

    struct ProfitTier {
        uint256 minInvestment;
        uint256 dailyRateBasisPoints;
        string tierName;
    }

    mapping(address => Investment[]) public userInvestments;
    mapping(address => uint256) public totalInvested;
    mapping(address => uint256) public totalShares;

    ProfitTier[4] public profitTiers;

    IHederaTokenService constant HTS = IHederaTokenService(0x0000000000000000000000000000000000000167);

    event InvestmentMade(
        address indexed investor,
        uint256 amountKsh,
        uint256 totalShares,
        uint256 timestamp
    );

    event SharesRedeemed(
        address indexed investor,
        uint256 shares,
        uint256 amountKsh,
        uint256 timestamp
    );

    event ProfitDistributed(
        address indexed investor,
        uint256 amount,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    constructor(address _hensTokenAddress, address _treasuryAccount) {
        owner = msg.sender;
        hensTokenAddress = _hensTokenAddress;
        treasuryAccount = _treasuryAccount;

        profitTiers[0] = ProfitTier(0, 10, "Starter");
        profitTiers[1] = ProfitTier(1000 * 100, 15, "Bronze");
        profitTiers[2] = ProfitTier(5000 * 100, 20, "Silver");
        profitTiers[3] = ProfitTier(20000 * 100, 25, "Gold");
    }

    function invest(uint256 amountKsh) external returns (uint256) {
        require(amountKsh >= 10 * 100, "Minimum investment is 10 KSh");

        uint256 baseShares = (amountKsh * 100) / henPriceInKsh;
        uint256 bonusShares = (baseShares * bonusPercentage) / 100;
        uint256 totalSharesAmount = baseShares + bonusShares;

        Investment memory newInvestment = Investment({
            amountKsh: amountKsh,
            baseShares: baseShares,
            bonusShares: bonusShares,
            totalShares: totalSharesAmount,
            timestamp: block.timestamp,
            lockedUntil: block.timestamp + (lockPeriodDays * 1 days),
            active: true
        });

        userInvestments[msg.sender].push(newInvestment);
        totalInvested[msg.sender] += amountKsh;
        totalShares[msg.sender] += totalSharesAmount;

        bytes[] memory metadata;
        HTS.mintToken(hensTokenAddress, int64(uint64(totalSharesAmount)), metadata);
        HTS.transferToken(hensTokenAddress, treasuryAccount, msg.sender, int64(uint64(totalSharesAmount)));

        emit InvestmentMade(msg.sender, amountKsh, totalSharesAmount, block.timestamp);

        return totalSharesAmount;
    }

    function redeemShares(uint256 shares) external returns (uint256) {
        require(shares > 0, "Must redeem positive amount");
        require(totalShares[msg.sender] >= shares, "Insufficient shares");

        uint256 amountKsh = (shares * henPriceInKsh) / 100;

        totalShares[msg.sender] -= shares;

        HTS.transferToken(hensTokenAddress, msg.sender, treasuryAccount, int64(uint64(shares)));

        emit SharesRedeemed(msg.sender, shares, amountKsh, block.timestamp);

        return amountKsh;
    }

    function getUserTier(address user) public view returns (uint256, string memory, uint256) {
        uint256 invested = totalInvested[user];

        for (uint256 i = profitTiers.length; i > 0; i--) {
            if (invested >= profitTiers[i-1].minInvestment) {
                return (i-1, profitTiers[i-1].tierName, profitTiers[i-1].dailyRateBasisPoints);
            }
        }

        return (0, profitTiers[0].tierName, profitTiers[0].dailyRateBasisPoints);
    }

    function calculateDailyProfit(address user) public view returns (uint256) {
        uint256 invested = totalInvested[user];
        (, , uint256 rateBasisPoints) = getUserTier(user);

        return (invested * rateBasisPoints) / 10000;
    }

    function getUserInvestments(address user) external view returns (Investment[] memory) {
        return userInvestments[user];
    }

    function updateHenPrice(uint256 newPrice) external onlyOwner {
        henPriceInKsh = newPrice;
    }

    function updateProfitTier(uint256 tierIndex, uint256 minInvestment, uint256 rateBasisPoints, string memory tierName) external onlyOwner {
        require(tierIndex < profitTiers.length, "Invalid tier index");
        profitTiers[tierIndex] = ProfitTier(minInvestment, rateBasisPoints, tierName);
    }

    function setHensTokenAddress(address _hensTokenAddress) external onlyOwner {
        hensTokenAddress = _hensTokenAddress;
    }
}
