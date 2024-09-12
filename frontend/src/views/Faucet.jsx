import React from 'react';
import { useWallet } from '../hooks/useWallet';
import { BanknotesIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { formatNumberWithComma } from './../utils/formatNumberWithComma';
import Loading from '../components/Loading';

const Faucet = () => {
  const { handleClaimFaucet, balances, isLoading } = useWallet();

  return (
    <div className="bg-white mt-10  shadow-lg rounded-t-lg p-10">
      {isLoading && <Loading />}
      <div className="p-5 text-center">
        <h1 className="text-2xl font-bold">Faucet</h1>
        <p className="text-gray-500">Get free tokens to test the platform.</p>
      </div>
      <div className="text-center p-5 pt-3">
        <div className="flex flex-col gap-8 p-6 lg:flex-row lg:gap-20 justify-center items-center ">
          <div className="bg-white p-4 rounded-lg shadow-lg w-full lg:w-1/2 text-center">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Current Tokens In Faucet
            </h3>
            <h1 className="text-3xl font-bold text-blue-500 flex  justify-center items-center gap-3">
              <BanknotesIcon className="h-5 w-5" />
              {formatNumberWithComma(balances.contractTokenBalance)}
            </h1>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-lg w-full lg:w-1/2 text-center">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Your Faucet Claims
            </h3>
            <h1 className="text-3xl font-bold text-blue-500  flex  justify-center items-center gap-3">
              <SparklesIcon className="h-5 w-5" />
              {formatNumberWithComma(balances.userTokenBalance)}
            </h1>
          </div>
        </div>

        <button
          className="bg-blue-500 text-white rounded-md p-3 mt-4 font-bold"
          onClick={handleClaimFaucet}
        >
          Get Tokens
        </button>
      </div>
    </div>
  );
};

export default Faucet;
