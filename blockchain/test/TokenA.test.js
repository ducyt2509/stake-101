const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('TokenA Contract', function () {
  let TokenA, tokenA, owner, addr1, addr2;

  beforeEach(async function () {
    TokenA = await ethers.getContractFactory('TokenA');
    [owner, addr1, addr2, _] = await ethers.getSigners();

    tokenA = await TokenA.deploy();
    await tokenA.deployed();
  });

  it('Should deploy the contract with the initial supply', async function () {
    const initialSupply = await tokenA.INITIAL_SUPPLY();
    const balance = await tokenA.balanceOf(tokenA.address);
    expect(balance).to.equal(initialSupply);
  });

  it('Should return the correct balanceOf the contract', async function () {
    const initialSupply = await tokenA.INITIAL_SUPPLY();
    const balance = await tokenA.balanceOf(tokenA.address);
    expect(balance).to.equal(initialSupply);
  });

  it('Should allow user to claim faucet correctly', async function () {
    await tokenA.connect(addr1).claimFaucet();
    const faucetAmount = await tokenA.FAUCET_CLAIM_AMOUNT();
    const balance = await tokenA.balanceOf(addr1.address);
    expect(balance).to.equal(faucetAmount);
  });

  it("Should revert if faucet contract doesn't have enough tokens", async function () {
    await tokenA.setStakingContract(tokenA.address);

    // Transfer some tokens out of the faucet to make sure it doesn't have enough tokens
    await tokenA.transfer(addr1.address, ethers.utils.parseEther('5000'));

    // Try to claim faucet when there are not enough tokens
    await expect(tokenA.claimFaucet()).to.be.revertedWith(
      'Faucet: Not enough tokens',
    );
  });
});
