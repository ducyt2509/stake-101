import React, { useState } from 'react';
import { convertAddress } from '../utils/convertAddress';
import { useWallet } from '../hooks/useWallet';
import Tabs from '../components/Tabs';
import { toast } from 'react-toastify';
import { useContracts } from '../hooks/useContracts';
import { formatNumberWithComma } from '../utils/formatNumberWithComma';
import contractAddresses from '../contracts/contract-addresses.json';
import { ethers } from 'ethers';
import { formatTimestamp } from '../utils/formatTimestamp';
import MultiSelect from './../components/MultiSelect';
import Loading from '../components/Loading';

const Home = () => {
  const {
    account,
    balances,
    provider,
    wallet,
    getBalance,
    handleClaimReward,
    symbol,
    isLoading,
    canClaim,
    setIsLoading,
  } = useWallet();

  const { tokenContract, stakingContract, nftbContract } = useContracts(
    provider,
    wallet,
    symbol,
  );

  const [transactionHash, setTransactionHash] = useState(null);
  const [isApprovalNFT, setIsApprovalNFT] = useState(false);

  const approveAllNFTs = async () => {
    try {
      const tx = await nftbContract.setApprovalForAll(
        contractAddresses[symbol].Staking,
        true,
      );
      setTransactionHash(`${convertAddress(tx.hash)}is loading ...`);
      await tx.wait();
      setIsApprovalNFT(true);
    } catch (error) {
      console.error(error);
      toast.error('Approval failed');
    } finally {
      setTransactionHash('Loading....');
    }
  };

  const tabs = [
    { name: 'Deposit', current: true },
    { name: 'Deposit NFT', current: false },
    { name: 'Withdraw', current: false },
    { name: 'Withdraw NFT', current: false },
  ];

  const [value, setValue] = useState({
    depositToken: 0,
    depositNFT: [],
    withdrawToken: 0,
    withdrawNFT: [],
  });

  const [activeTab, setActiveTab] = useState(tabs[0].name);

  const handleTabClick = (tab) => {
    setActiveTab(tab.name);
  };

  const handleDepositTokens = async () => {
    const amount = value.depositToken;
    if (amount <= 0) {
      toast.error('Amount is required and should be greater than 0');
      return;
    }

    try {
      setIsLoading(true);
      const tx = await stakingContract.depositTokens(
        ethers.utils.parseEther(amount.toString()),
        { gasLimit: 1000000 },
      );
      setTransactionHash(`${convertAddress(tx.hash)}is loading ...`);
      await tx.wait();
      toast.success(`Deposited ${amount} tokens successfully!`);
      setValue({ ...value, depositToken: 0 });
    } catch (error) {
      console.error(error);
      toast.error('Deposit failed');
    } finally {
      setIsLoading(false);
      setTransactionHash(null);
      getBalance();
    }
  };

  const handleDepositNFT = async () => {
    setIsLoading(true);
    let listNFTs = value.depositNFT;
    if (!listNFTs || listNFTs.length === 0) {
      toast.error('At least one NFT must be selected for deposit.');
      return;
    }

    console.log('listNFTs', listNFTs);
    try {
      if (!isApprovalNFT) {
        await approveAllNFTs();
      }
      listNFTs = listNFTs.map((nft) => nft.value);
      console.log('listNFTs2', listNFTs);
      const tx = await stakingContract.depositNFT(listNFTs);
      await tx.await;
      await getBalance();
      setValue({ ...value, depositNFT: [] });
      toast.success(`Deposited NFT ${listNFTs} successfully!`);
    } catch (error) {
      console.error(error);
      toast.error('Deposit NFTs failed');
    } finally {
      setIsLoading(false);
      setTransactionHash(null);
    }
  };

  const handleWithdrawNFT = async () => {
    setIsLoading(true);
    let listNFTs = value.withdrawNFT;
    if (!listNFTs || listNFTs.length === 0) {
      toast.error('At least one NFT must be selected for withdrawal.');
      return;
    }

    try {
      // Loop through each NFT and withdraw
      listNFTs = listNFTs.map((nft) => nft.value);
      const tx = await stakingContract.withdrawNFT(listNFTs);
      setTransactionHash(`${convertAddress(tx.hash)}is loading ...`);
      await tx.wait();
      toast.success(`Withdrawn NFT ${listNFTs} successfully!`);
      await getBalance();
      setValue({ ...value, withdrawNFT: [] });
    } catch (error) {
      console.error(error);
      toast.error('Withdraw NFTs failed');
    } finally {
      setIsLoading(false);
      setTransactionHash('Loading....');
    }
  };

  const handleWithdrawTokens = async () => {
    const amount = parseFloat(value.withdrawToken);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Amount is required and should be greater than 0');
      return;
    }

    try {
      setIsLoading(true);
      const tx = await stakingContract.withdrawTokens(
        ethers.utils.parseEther(amount.toString()),
      );
      setTransactionHash(`${convertAddress(tx.hash)}is loading ...`);
      await tx.wait();
      toast.success('Withdrawn tokens successfully!');
      getBalance();
    } catch (error) {
      console.error(error);
      toast.error('Withdraw failed');
    } finally {
      setTransactionHash(null);
      setIsLoading(false);
    }
  };

  const createOptionsFromArray = (array, prefix = '') => {
    return array.length > 0
      ? array.map((item) => ({
          value: item,
          label: prefix + item,
        }))
      : [];
  };

  const handleMultiSelectChange = (selectedOptions) => {
    // Xử lý các lựa chọn được chọn
    if (activeTab === 'Deposit NFT') {
      setValue({ ...value, depositNFT: selectedOptions });
    } else if (activeTab === 'Withdraw NFT') {
      setValue({ ...value, withdrawNFT: selectedOptions });
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Deposit':
        return (
          <div className="flex flex-col">
            <input
              type="number"
              placeholder="Deposit Token Amount"
              className="border border-gray-300 rounded-md p-2 mt-2 px-4"
              value={value.depositToken}
              onChange={(e) =>
                setValue({ ...value, depositToken: e.target.value })
              }
            />
            <button
              className={`bg-blue-500 text-white rounded-md p-2 mt-4`}
              disabled={!value.depositToken || value.depositToken <= 0}
              onClick={handleDepositTokens}
            >
              Deposit
            </button>
          </div>
        );
      case 'Deposit NFT':
        return (
          <div className="flex flex-col  mt-2 px-4">
            <MultiSelect
              handleMultiSelectChange={handleMultiSelectChange}
              dataOptions={createOptionsFromArray(balances.userNfts, '#NFT ')}
              selectedOptions={value.depositNFT}
            ></MultiSelect>
            <button
              className="bg-blue-500 text-white rounded-md p-2 mt-4"
              disabled={!value.depositNFT}
              onClick={handleDepositNFT}
            >
              Deposit
            </button>
          </div>
        );
      case 'Withdraw':
        return (
          <div className="flex flex-col">
            <input
              type="number"
              placeholder="Withdraw Token Amount"
              className="border border-gray-300 rounded-md p-2 mt-2 px-4"
              value={value.withdrawToken}
              onChange={(e) =>
                setValue({ ...value, withdrawToken: e.target.value })
              }
            />
            <button
              className="bg-blue-500 text-white rounded-md p-2 mt-4"
              disabled={!value.withdrawToken || value.withdrawToken <= 0}
              onClick={handleWithdrawTokens}
            >
              Withdraw
            </button>
          </div>
        );
      case 'Withdraw NFT':
        return (
          <div className="flex flex-col  mt-2 px-4">
            <MultiSelect
              selectedOptions={value.withdrawNFT}
              handleMultiSelectChange={handleMultiSelectChange}
              dataOptions={createOptionsFromArray(
                balances.depositedNfts,
                '#NFT ',
              )}
            ></MultiSelect>
            <button
              className="bg-blue-500 text-white rounded-md p-2 mt-4"
              disabled={!value.withdrawNFT}
              onClick={handleWithdrawNFT}
            >
              Withdraw NFT
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container py-10 mt-10 gap-3 flex lg:flex-row flex-col">
      {isLoading && <Loading transactionHash={transactionHash}></Loading>}
      <div className="mx-auto lg:w-2/5 w-full sm:px-6 lg:px-8 bg-white shadow-md rounded-lg py-10">
        <h1 className="text-xl font-bold divide-x-4 text-gray-800">
          Welcome to Blockchain 101
        </h1>

        <div className="bg-blue-200 p-3 mt-4 rounded-lg">
          <p className="text-sm ">Address: {convertAddress(account)}</p>
          <p className="text-sm">
            Your Tokens: {formatNumberWithComma(balances.userTokenBalance)}
          </p>
          <p className="text-sm">Minted NFT: {balances.userNftCount}</p>
        </div>
        <div className="bg-yellow-200 p-3 mt-4 rounded-lg">
          <p className="text-sm">
            Deposited Tokens:{' '}
            {formatNumberWithComma(balances.depositedTokenAmount)}
          </p>
          <p className="text-sm">APR Balance: {balances.apr / 100}%</p>
          <p className="text-sm">
            Deposited NFTs: {balances.depositedNftCount}
          </p>
          <p className="text-sm">
            Reward Tokens :{balances.pendingRewardTokens}
          </p>
          <p className="text-sm">
            Lock Time: {formatTimestamp(balances.lockTime * 1000)}{' '}
            {balances.lockTime != '0' &&
            balances.lockTime * 1000 < new Date().getTime()
              ? '(UnLocked)'
              : 'Locked'}
          </p>
        </div>

        <div>
          <button
            className={` text-white rounded-md p-2 mt-4
              ${!canClaim ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-500'}
            `}
            onClick={handleClaimReward}
            disabled={!canClaim}
          >
            Claim Reward
          </button>
        </div>
      </div>
      <div className="mx-auto lg:w-3/5 w-full px-2 sm:px-6 lg:px-8 bg-white rounded-lg shadow-md py-10">
        <Tabs tabs={tabs} onTabClick={handleTabClick} />
        <div className="mt-6">{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default Home;
