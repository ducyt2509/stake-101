// src/hooks/useContracts.js
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import NFTB from '../contracts/NFTB.json';
import Staking from '../contracts/Staking.json';
import TokenA from '../contracts/TokenA.json';
import contractAddresses from '../contracts/contract-addresses.json';

export const useContracts = (provider, signer, symbol) => {
  const [tokenContract, setTokenContract] = useState(null);
  const [stakingContract, setStakingContract] = useState(null);
  const [nftbContract, setNftbContract] = useState(null);

  useEffect(() => {
    if (provider && signer && symbol) {
      const chainContracts = contractAddresses[symbol];
      console.log('chainContracts', chainContracts);

      if (chainContracts) {
        const token = new ethers.Contract(
          chainContracts.TokenA,
          TokenA.abi,
          signer || provider,
        );
        const staking = new ethers.Contract(
          chainContracts.Staking,
          Staking.abi,
          signer || provider,
        );
        const nftb = new ethers.Contract(
          chainContracts.NFTB,
          NFTB.abi,
          signer || provider,
        );

        setTokenContract(token);
        setStakingContract(staking);
        setNftbContract(nftb);
      } else {
        console.error('Symbol not found in contract addresses');
      }
    }
  }, [provider, signer, symbol]);

  return { tokenContract, stakingContract, nftbContract };
};
