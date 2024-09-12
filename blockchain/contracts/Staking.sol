// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./NFTB.sol";
import "./TokenA.sol";

contract Staking is Ownable {
    enum ActionType {
        DepositToken,
        WithdrawToken,
        ClaimReward,
        DepositNFT,
        WithdrawNFT
    }

    struct StakeDetails {
        uint256 totalStakedTokens;
        uint256 tokenStakeStartTimestamp;
        uint256 lockEndTimestamp;
        uint256 nftStakeStartTimestamp;
        uint256 lastActionTimestamp;
        uint256 totalMintedNFTs;
        uint256 effectiveAPR;
        uint256 stakedNFTCount;
        uint256 pendingRewards;
    }

    TokenA public tokenA;
    NFTB public nftB;

    uint256 public constant LOCK_PERIOD = 1 minutes;
    uint256 public constant NFT_MIN_STAKE_THRESHOLD = 1e6 * 1e18; // 1 triệu token
    uint256 public constant baseAnnualPercentageRate = 800;
    uint256 public constant nftBonusAnnualPercentageRate = 200;

    mapping(address => StakeDetails) public userStakes;
    mapping(address => uint256[]) public userMintedNFTs;
    mapping(address => uint256[]) public userStakedNFTs;

    event StakeAction(
        address indexed user,
        ActionType actionType,
        uint256 totalAmount,
        uint256[] nftIds,
        uint256 withdrawalFromRewards,
        uint256 withdrawalFromStake
    );

    constructor(address _tokenA, address _nftB) Ownable(msg.sender) {
        tokenA = TokenA(_tokenA);
        nftB = NFTB(_nftB);
    }

    function depositTokens(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");

        updateReward(msg.sender); // Tính toán và cập nhật phần thưởng trước khi deposit

        StakeDetails storage stake = userStakes[msg.sender];

        if (stake.totalStakedTokens == 0) {
            stake.tokenStakeStartTimestamp = block.timestamp;
        }

        require(
            tokenA.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        stake.totalStakedTokens += amount;
        stake.lastActionTimestamp = block.timestamp;
        stake.lockEndTimestamp = block.timestamp + LOCK_PERIOD;
        stake.effectiveAPR = calculateEffectiveAPR(msg.sender);

        uint256 totalDepositToken = stake.totalStakedTokens;
        uint256 nftToMint = calculateNFTsToMint(totalDepositToken);

        if (nftToMint > 0) {
            for (uint256 i = 0; i < nftToMint; i++) {
                uint256 nftId = nftB.mintNFT(msg.sender);
                userMintedNFTs[msg.sender].push(nftId);
                stake.totalMintedNFTs++;
            }
        }

        emit StakeAction(
            msg.sender,
            ActionType.DepositToken,
            amount,
            new uint256[](0),
            0,
            0
        );
    }

    function withdrawTokens(uint256 amount) external {
        StakeDetails storage stake = userStakes[msg.sender];
        require(stake.totalStakedTokens > 0, "No tokens to withdraw");
        require(
            block.timestamp >= stake.lockEndTimestamp,
            "Tokens are still locked"
        );

        updateReward(msg.sender); // Tính toán và cập nhật phần thưởng trước khi withdraw

        uint256 totalAvailable = stake.totalStakedTokens +
            stake.pendingRewards +
            calculateReward(msg.sender);

        require(
            totalAvailable >= amount,
            "Insufficient balance for withdrawal"
        );

        uint256 rewardToWithdraw = 0;
        uint256 amountToWithdraw = amount;

        if (stake.pendingRewards >= amount) {
            stake.pendingRewards -= amount;
            rewardToWithdraw = amount;
        } else {
            rewardToWithdraw = stake.pendingRewards;
            stake.pendingRewards = 0;
            amountToWithdraw -= rewardToWithdraw;
            require(
                tokenA.balanceOf(address(this)) >= amountToWithdraw,
                "Insufficient token balance in contract"
            );
            require(
                tokenA.transfer(msg.sender, amountToWithdraw),
                "Failed to transfer tokens"
            );
        }

        require(
            tokenA.transferReward(msg.sender, rewardToWithdraw),
            "Failed to transfer rewards"
        );
        stake.totalStakedTokens -= amountToWithdraw;
        stake.lastActionTimestamp = block.timestamp;

        emit StakeAction(
            msg.sender,
            ActionType.WithdrawToken,
            amount,
            new uint256[](0),
            rewardToWithdraw,
            amountToWithdraw
        );
    }

    function depositNFT(uint256[] calldata nftIds) external {
        require(nftIds.length > 0, "No NFTs provided for deposit");

        updateReward(msg.sender); // Tính toán và cập nhật phần thưởng trước khi deposit NFT

        StakeDetails storage stake = userStakes[msg.sender];

        for (uint256 i = 0; i < nftIds.length; i++) {
            uint256 nftId = nftIds[i];

            require(
                nftB.ownerOf(nftId) == msg.sender,
                "You do not own this NFT"
            );

            nftB.transferFrom(msg.sender, address(this), nftId);
            userStakedNFTs[msg.sender].push(nftId);
            _removeNFTFromUserMintedList(msg.sender, nftId);
        }

        stake.nftStakeStartTimestamp = block.timestamp;
        stake.stakedNFTCount += nftIds.length;
        //Số lượng NFT có
        stake.totalMintedNFTs -= nftIds.length;
        stake.effectiveAPR = calculateEffectiveAPR(msg.sender);
        stake.lastActionTimestamp = block.timestamp;

        emit StakeAction(
            msg.sender,
            ActionType.DepositNFT,
            nftIds.length,
            nftIds,
            0,
            0
        );
    }

    function withdrawNFT(uint256[] calldata nftIds) external {
        require(nftIds.length > 0, "No NFTs provided for withdrawal");

        updateReward(msg.sender);

        StakeDetails storage stake = userStakes[msg.sender];

        for (uint256 i = 0; i < nftIds.length; i++) {
            uint256 nftId = nftIds[i];
            require(
                isNFTStakedByUser(msg.sender, nftId),
                "NFT is not staked by user"
            );

            uint256[] storage userNFTs = userStakedNFTs[msg.sender];
            for (uint256 j = 0; j < userNFTs.length; j++) {
                if (userNFTs[j] == nftId) {
                    userNFTs[j] = userNFTs[userNFTs.length - 1];
                    userNFTs.pop();

                    _addNFTToUserMintedList(msg.sender, nftId);
                    break;
                }
            }
            stake.stakedNFTCount--;

            nftB.transferFrom(address(this), msg.sender, nftId);
        }

        stake.totalMintedNFTs += nftIds.length;
        stake.lastActionTimestamp = block.timestamp;
        stake.effectiveAPR = calculateEffectiveAPR(msg.sender);

        emit StakeAction(
            msg.sender,
            ActionType.WithdrawNFT,
            nftIds.length,
            nftIds,
            0,
            0
        );
    }

    function claimReward() external {
        updateReward(msg.sender);
        StakeDetails storage stake = userStakes[msg.sender];
        require(
            block.timestamp >= stake.lockEndTimestamp,
            "Lock period not yet ended"
        );
        uint256 reward = stake.pendingRewards;

        require(reward > 0, "No rewards available to claim");
        require(
            tokenA.balanceOf(address(this)) >= reward,
            "Insufficient balance in contract"
        );

        require(
            tokenA.transferReward(msg.sender, reward),
            "Failed to transfer reward"
        );

        stake.pendingRewards = 0; // Reset pending rewards sau khi claim

        emit StakeAction(
            msg.sender,
            ActionType.ClaimReward,
            reward,
            new uint256[](0),
            reward,
            0
        );
    }

    function calculateReward(address user) internal view returns (uint256) {
        StakeDetails memory stake = userStakes[user];
        uint256 reward = 0;

        if (stake.totalStakedTokens > 0) {
            uint256 stakedDuration = block.timestamp -
                stake.lastActionTimestamp;
            uint256 apr = stake.effectiveAPR;

            reward +=
                (stake.totalStakedTokens * apr * stakedDuration) /
                (365 days * 1000);
        }

        return reward;
    }

    function calculateEffectiveAPR(
        address user
    ) internal view returns (uint256) {
        StakeDetails memory stake = userStakes[user];
        uint256 effectiveAPR = baseAnnualPercentageRate;

        if (stake.stakedNFTCount > 0) {
            effectiveAPR += nftBonusAnnualPercentageRate * stake.stakedNFTCount;
        }

        return effectiveAPR;
    }

    function calculateNFTsToMint(
        uint256 totalStaked
    ) internal view returns (uint256) {
        uint256 newNFTs = totalStaked /
            NFT_MIN_STAKE_THRESHOLD -
            userMintedNFTs[msg.sender].length;
        return newNFTs > 0 ? newNFTs : 0;
    }

    function isNFTStakedByUser(
        address user,
        uint256 nftId
    ) internal view returns (bool) {
        uint256[] memory nftIds = userStakedNFTs[user];
        for (uint256 i = 0; i < nftIds.length; i++) {
            if (nftIds[i] == nftId) {
                return true;
            }
        }
        return false;
    }

    function updateReward(address user) internal {
        StakeDetails storage stake = userStakes[user];

        if (stake.totalStakedTokens > 0) {
            uint256 reward = calculateReward(user);
            stake.pendingRewards += reward;
            stake.lastActionTimestamp = block.timestamp;
        }
    }

    function getStakeDetails()
        external
        view
        returns (
            uint256 totalStakedTokens,
            uint256 tokenStakeStartTimestamp,
            uint256 lockEndTimestamp,
            uint256 nftStakeStartTimestamp,
            uint256 lastActionTimestamp,
            uint256 totalMintedNFTs,
            uint256 effectiveAPR,
            uint256 stakedNFTCount,
            uint256 pendingRewards
        )
    {
        StakeDetails storage stake = userStakes[msg.sender];
        uint256 pendingReward = stake.pendingRewards +
            calculateReward(msg.sender);
        return (
            stake.totalStakedTokens,
            stake.tokenStakeStartTimestamp,
            stake.lockEndTimestamp,
            stake.nftStakeStartTimestamp,
            stake.lastActionTimestamp,
            stake.totalMintedNFTs,
            calculateEffectiveAPR(msg.sender),
            stake.stakedNFTCount,
            pendingReward
        );
    }

    function getUserMintedNFTs() external view returns (uint256[] memory) {
        return userMintedNFTs[msg.sender];
    }

    function getUserStakedNFTs() external view returns (uint256[] memory) {
        return userStakedNFTs[msg.sender];
    }

    function _removeNFTFromUserMintedList(
        address user,
        uint256 nftId
    ) internal {
        uint256[] storage nftList = userMintedNFTs[user];
        uint256 length = nftList.length;

        // Tìm chỉ mục của nftId
        for (uint256 i = 0; i < length; i++) {
            if (nftList[i] == nftId) {
                nftList[i] = nftList[length - 1]; // Đưa phần tử cuối cùng vào vị trí cần xóa
                nftList.pop(); // Xóa phần tử cuối cùng
                return;
            }
        }
        revert("NFT not found in list");
    }

    function _addNFTToUserMintedList(address user, uint256 nftId) internal {
        userMintedNFTs[user].push(nftId);
    }
}
