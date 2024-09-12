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
  // eslint-disable-next-line
  const [symbol, setSymbol] = useState(chainInfo.symbol);
  // eslint-disable-next-line
  const [currentChainId, setCurrentChainId] = useState(null);
  const [canClaim, setCancClaim] = useState(false);

  const [balances, setBalances] = useState({
    userTokenBalance: 0,
    contractTokenBalance: 0,
    userNftCount: 0,
    depositedNftCount: 0,
    depositedTokenAmount: 0,
    userNfts: [],
    depositedNfts: [],
    lockTime: 0,
    apr: 0,
    pendingRewardTokens: 0,
  });

  const { tokenContract, stakingContract, nftbContract } = useContracts(
    provider,
    wallet,
    chainInfo.symbol,
  );

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
          const newChainId = parseInt(chainId, 16);
          setCurrentChainId(newChainId);

          if (newChainId === chainInfo.id) {
            setNetworkError(null);
          } else {
            setNetworkError(`Please switch to the ${chainInfo.name} network`);
            setWallet(null);
            setAccount(null);
          }
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
    if (window.ethereum) {
      try {
        console.log('Attempting to connect wallet...');
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        // Check current network
        const currentChainId = await window.ethereum.request({
          method: 'eth_chainId',
        });
        const desiredChainId = ethers.utils.hexValue(chainInfo.id);

        console.log('Current chain ID:', currentChainId);
        console.log('Desired chain ID:', desiredChainId);

        if (currentChainId !== desiredChainId) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: desiredChainId }],
            });
          } catch (switchError) {
            // This error code indicates that the chain has not been added to MetaMask
            if (switchError.code === 4902) {
              try {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [
                    {
                      chainId: desiredChainId,
                      chainName: chainInfo.name,
                      nativeCurrency: {
                        name: chainInfo.symbol,
                        symbol: chainInfo.symbol,
                        decimals: 18,
                      },
                      rpcUrls: [chainInfo.rpcUrl],
                      blockExplorerUrls: [chainInfo.blockExplorerUrl],
                    },
                  ],
                });
              } catch (addError) {
                console.error('Error adding the network:', addError);
                setNetworkError('Failed to add the network to MetaMask');
                return;
              }
            } else {
              console.error('Failed to switch network:', switchError);
              setNetworkError('Failed to switch network');
              return;
            }
          }
        }

        // Create new provider and signer after ensuring we're on the correct network
        const newProvider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(newProvider);

        const signer = newProvider.getSigner();
        setWallet(signer);

        const address = await signer.getAddress();
        setAccount(address);

        console.log('Wallet connected:', address);
        setNetworkError(null);

        // Update balance and other info if needed
        await handleGetBalance();
      } catch (err) {
        console.error('Error connecting wallet:', err);
        setNetworkError('Failed to connect wallet: ' + err.message);
      }
    } else {
      setNetworkError('MetaMask is not installed');
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
      const tx = await tokenContract.claimFaucet();
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
      const userStake = await stakingContract.getStakeDetails();

      const getUserNft = await stakingContract.getUserMintedNFTs();
      const userNfts = getUserNft.map((nftId) =>
        ethers.utils.formatUnits(nftId, 0),
      );

      const getDepositNft = await stakingContract.getUserStakedNFTs();
      const depositedNfts = getDepositNft.map((nftId) =>
        ethers.utils.formatUnits(nftId, 0),
      );

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
        userNfts, // Gán danh sách NFT đã mint sau khi convert
        depositedNfts: depositedNfts, // Gán danh sách NFT đã stake sau khi convert
        pendingRewardTokens: ethers.utils.formatUnits(
          userStake.pendingRewards,
          18,
        ),
      }));

      setCancClaim(
        ethers.utils.formatUnits(userStake.lockEndTimestamp, 0) * 1000 <
          Date.now(),
      );
    } catch (error) {
      console.error('Error fetching balance:', error);
      setNetworkError('Failed to fetch balance');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimReward = async () => {
    if (!stakingContract) return;

    try {
      setIsLoading(true);
      const tx = await stakingContract.claimReward();
      console.log('Transaction sent:', tx.hash);
      await tx.wait();
      console.log('Transaction confirmed');
      toast.success('Rewards claimed successfully');
    } catch (error) {
      console.error('Full error details:', error);
      if (error.code === 4001) {
        // User rejected the transaction
        toast.error('Transaction was rejected by the user');
      } else if (error.code === -32603) {
        // Internal JSON-RPC error
        toast.error('An internal error occurred. Please try again.');
      } else if (error?.data?.message) {
        setNetworkError(error.data.message);
        toast.error(error.data.message);
      } else {
        setNetworkError('Failed to claim rewards: ' + error.message);
        toast.error('Failed to claim rewards: ' + error.message);
      }
    } finally {
      setIsLoading(false);
      await getBalance();
    }
  };

  const getBalance = async () => {
    if (!account || !tokenContract || !stakingContract || !nftbContract) return;

    try {
      console.log('Fetching get balance...');
      const userTokenBalance = ethers.utils.formatUnits(
        await tokenContract.balanceOf(account),
        18,
      );
      const contractTokenBalance = ethers.utils.formatUnits(
        await tokenContract.balanceOf(contractAddresses[symbol].TokenA),
        18,
      );

      const userStake = await stakingContract.getStakeDetails();

      const getUserNft = await stakingContract.getUserMintedNFTs();
      const userNfts = getUserNft.map((nftId) =>
        ethers.utils.formatUnits(nftId, 0),
      );

      const getDepositNft = await stakingContract.getUserStakedNFTs();
      const depositedNfts = getDepositNft.map((nftId) =>
        ethers.utils.formatUnits(nftId, 0),
      );

      setBalances((prev) => ({
        ...prev,
        userTokenBalance,
        contractTokenBalance,
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
        pendingRewardTokens: ethers.utils.formatUnits(
          userStake.pendingRewards,
          18,
        ),
        userNfts, // Gán danh sách NFT đã mint sau khi convert
        depositedNfts: depositedNfts, // Gán danh sách NFT đã stake sau khi convert
      }));

      setCancClaim(
        ethers.utils.formatUnits(userStake.lockEndTimestamp, 0) * 1000 <
          Date.now(),
      );
    } catch (error) {
      console.error('Error fetching balance:', error);
      setNetworkError('Failed to fetch balance');
    }
  };

  useEffect(() => {
    if (!account || !stakingContract) return;
    console.log('Fetching handleCalculateReward...');

    const intervalId = setInterval(async () => {
      await getBalance();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [stakingContract, account]);

  return (
    <WalletContext.Provider
      value={{
        provider,
        wallet,
        account,
        connectWallet,
        disconnectWallet,
        handleClaimFaucet,
        handleClaimReward,
        getBalance,
        balances,
        networkError,
        isLoading,
        symbol,
        setIsLoading,
        canClaim,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  return useContext(WalletContext);
};
