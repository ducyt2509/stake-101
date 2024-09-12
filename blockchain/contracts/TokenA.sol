// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenA is ERC20, Ownable {
    uint256 public constant INITIAL_SUPPLY = 1000000000e18; // 1B tokens
    uint256 public constant FAUCET_AMOUNT = 10000000e18; // 10M tokens /1 user
    uint256 public constant FAUCET_CLAIM_AMOUNT = 1000000e18; // 1M tokens /claim
    address public stakingContract;

    mapping(address => uint256) public claimedFaucet;

    event FaucetClaimed(address indexed user, uint256 amount);
    event RewardTransferred(address indexed to, uint256 amount);

    constructor() ERC20("Token A", "TKA") Ownable(msg.sender) {
        _mint(address(this), INITIAL_SUPPLY);
    }

    function setStakingContract(address _stakingContract) external onlyOwner {
        stakingContract = _stakingContract;
    }

    function transferReward(address to, uint256 amount) external returns (bool) {
        require(
            msg.sender == stakingContract,
            "Only Staking contract can withdraw"
        );
        require(
            balanceOf(address(this)) >= amount,
            "Insufficient balance in contract"
        );

        _transfer(address(this), to, amount);
        emit RewardTransferred(to, amount);
        return true;
    }

    function claimFaucet() public {
        require(
            claimedFaucet[msg.sender] + FAUCET_CLAIM_AMOUNT <= FAUCET_AMOUNT,
            "Faucet: You have reached the limit"
        );
        require(
            balanceOf(address(this)) >= FAUCET_CLAIM_AMOUNT,
            "Insufficient balance in contract"
        );

        claimedFaucet[msg.sender] += FAUCET_CLAIM_AMOUNT;
        _transfer(address(this), msg.sender, FAUCET_CLAIM_AMOUNT);
        emit FaucetClaimed(msg.sender, FAUCET_CLAIM_AMOUNT);
    }
}
