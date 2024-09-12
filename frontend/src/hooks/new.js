import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useContracts } from './useContracts';
import contractAddresses from '../contracts/contract-addresses.json';
import { toast } from 'react-toastify';

const WalletContext = createContext();

export const WalletProvider = ({ children, chainInfo }) => {
  const [provider, setProvider] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [account, setAccount] = useState(null);
  const [networkError, setNetworkError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [symbol, setSymbol] = useState(chainInfo.symbol);

  const [balances, setBalances] = useState({
    userTokenBalance: 0,
    contractTokenBalance: 0,
    userNftCount: 0,
    depositedNftCount: 0,
    depositedTokenAmount: 0,
    userNfts: [],
    depositedNft: [],
    lockTime: 0,
    apr: 0,
    pendingRewardTokens: 0,
  });

  const { tokenContract, stakingContract, nftbContract } = useContracts(
    provider,
    wallet,
    chainInfo.symbol,
  );

  const [currentChainId, setCurrentChainId] = useState(null);

  useEffect(() => {
    const initProvider = async () => {
      if (window.ethereum) {
        const init = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(init);

        const checkNetwork = async () => {
          try {
            const network = await init.getNetwork();
            setCurrentChainId(network.chainId);
            if (network.chainId !== chainInfo.id) {
              setNetworkError(
                `Please connect to the ${chainInfo.name} network`,
              );
            } else {
              setNetworkError(null);
            }
          } catch (error) {
            console.error('Error checking network:', error);
            setNetworkError('Failed to check network');
          }
        };

        await checkNetwork();

        const handleChainChange = async (chainId) => {
          setCurrentChainId(chainId);
          await checkNetwork();
        };

        window.ethereum.on('chainChanged', handleChainChange);

        return () => {
          window.ethereum.removeListener('chainChanged', handleChainChange);
        };
      } else {
        setNetworkError('MetaMask is not installed');
      }
    };

    initProvider();
  }, [chainInfo]);

  useEffect(() => {
    if (provider && wallet) {
      const fetchAccountDetails = async () => {
        try {
          const connectedAccount = await wallet.getAddress();
          setAccount(connectedAccount);
        } catch (err) {
          console.error('Error fetching account details:', err);
          setNetworkError('Failed to fetch account details');
        }
      };

      fetchAccountDetails();
    }
  }, [provider, wallet]);

  useEffect(() => {
    if (account && tokenContract && stakingContract && nftbContract) {
      handleGetBalance();
    }
  }, [account, tokenContract, stakingContract, nftbContract]);

  const connectWallet = async () => {
    if (provider) {
      try {
        console.log('Attempting to connect wallet...');
        await provider.send('eth_requestAccounts', []);
        const signer = provider.getSigner();
        setWallet(signer);
        console.log('Wallet connected');

        // Check network and prompt user to switch if necessary
        if (currentChainId !== chainInfo.id) {
          setNetworkError(`Please switch to the ${chainInfo.name} network`);
          try {
            await provider.send('wallet_switchEthereumChain', [
              { chainId: ethers.utils.hexValue(chainInfo.id) },
            ]);
          } catch (switchError) {
            console.error('Failed to switch network:', switchError);
            setNetworkError('Failed to switch network');
          }
        }
      } catch (err) {
        console.error('Error connecting wallet:', err);
        setNetworkError('Failed to connect wallet');
      }
    } else {
      console.error('Provider not found');
    }
  };

  const disconnectWallet = () => {
    setWallet(null);
    setAccount(null);
  };

  const handleClaimFaucet = async () => {
    if (!tokenContract) return;

    try {
      setIsLoading(true);
      const gasLimit = await tokenContract.estimateGas.claimFaucet(); // Ước tính gas
      const tx = await tokenContract.claimFaucet({
        gasLimit: gasLimit.toString(), // Chuyển đổi gasLimit về chuỗi nếu cần
        gasPrice: ethers.utils.parseUnits('5', 'gwei'), // Điều chỉnh gasPrice nếu cần
      });
      await tx.wait();
      await handleGetBalance();
      toast.success('Faucet claimed successfully');
    } catch (error) {
      console.error('Full error details:', error);
      if (error?.data?.message) {
        setNetworkError(error.data.message);
      } else {
        setNetworkError('Failed to claim faucet');
      }
      toast.error('Failed to claim faucet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetBalance = async () => {
    if (!account || !tokenContract || !stakingContract || !nftbContract) return;

    try {
      setIsLoading(true);
      console.log('Fetching balance...');

      const userTokenBalance = ethers.utils.formatUnits(
        await tokenContract.balanceOf(account),
        18,
      );
      const contractTokenBalance = ethers.utils.formatUnits(
        await tokenContract.balanceOf(contractAddresses[symbol].TokenA),
        18,
      );
      const userStake = await stakingContract.userStakes(account);
      const getUserNft = await stakingContract.getUserMintedNFTs();
      const getDepositNft = await stakingContract.getUserStakedNFTs();

      setBalances((prev) => ({
        ...prev,
        contractTokenBalance,
        userTokenBalance,
        userNftCount: ethers.utils.formatUnits(userStake.totalMintedNFTs, 0),
        depositedNftCount: ethers.utils.formatUnits(
          userStake.stakedNFTCount,
          0,
        ),
        depositedTokenAmount: ethers.utils.formatUnits(
          userStake.totalStakedTokens,
        ),
        lockTime: ethers.utils.formatUnits(userStake.lockEndTimestamp, 0),
        apr: ethers.utils.formatUnits(userStake.effectiveAPR, 0),
        userNfts: getUserNft,
        depositedNft: getDepositNft,
      }));
      calculatorRewardToken();
    } catch (error) {
      console.error('Error fetching balance:', error);
      setNetworkError('Failed to fetch balance');
    } finally {
      setIsLoading(false);
    }
  };

  const calculatorRewardToken = async () => {
    if (!stakingContract || !account) {
      console.error('Contract or account is not available');
      return;
    }

    try {
      // const getUserStakeDetails = await stakingContract.getStakeDetails(account);
      // setBalances((prev) => ({
      //   ...prev,
      //   pendingRewardTokens: ethers.utils.formatUnits(getUserStakeDetails.pendingRewards , 18),
      // }));
    } catch (error) {
      console.error('Error claiming rewards:', error);
    }
  };

  useEffect(() => {
    if (!account || !stakingContract) return;
    console.log('Fetching handleCalculateReward...');

    // Cập nhật mỗi 10 giây
    const intervalId = setInterval(() => {
      calculatorRewardToken();
    }, 10000);

    // Cleanup interval khi component unmount
    return () => clearInterval(intervalId);
  }, [stakingContract, account]);

  const handleClaimRewards = async () => {
    if (!stakingContract) return;

    try {
      setIsLoading(true);
      const tx = await stakingContract.claimRewards();
      await tx.wait();
      console.log('Rewards claimed');
      await handleGetBalance();
      toast.success('Rewards claimed successfully');
    } catch (error) {
      console.error('Error claiming rewards:', error);
      setNetworkError('Failed to claim rewards');
      toast.error('Failed to claim rewards');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        provider,
        wallet,
        account,
        connectWallet,
        disconnectWallet,
        networkError,
        isLoading,
        handleClaimFaucet,
        handleGetBalance,
        balances,
        handleClaimRewards,
        symbol,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
