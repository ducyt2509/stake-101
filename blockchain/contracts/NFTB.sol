// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTB is ERC721, Ownable {
    uint256 private _currentTokenId;
    address public stakingContract;

    constructor() ERC721("NFT B", "NFTB") Ownable(msg.sender) {
        stakingContract = msg.sender;
    }

    function setStakingContract(address _stakingContract) external onlyOwner {
        stakingContract = _stakingContract;
    }

    function mintNFT(
        address to
    ) external onlyStakingContract returns (uint256 tokenId) {
        tokenId = _currentTokenId;
        _safeMint(to, tokenId);
        _currentTokenId++;
        return tokenId;
    }

    modifier onlyStakingContract() {
        require(msg.sender == stakingContract, "Not authorized");
        _;
    }
}
