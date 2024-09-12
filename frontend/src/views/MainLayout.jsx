// src/views/MainLayout.js
import React from 'react';
import Navbar from '../components/Navbar';
import { useWallet } from '../hooks/useWallet';
import Home from './Home';
import { Routes, Route } from 'react-router-dom';
import ConnectWallet from './ConnectWallet';
import Faucet from './Faucet';
import TransactionList from './History';

export const MainLayout = () => {
  const { account } = useWallet();

  return (
    <div className="body">
      {!account ? (
        <ConnectWallet />
      ) : (
        <div className="mx-auto w-4/5 p-10 px-2 sm:px-6 lg:px-8">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/faucet" element={<Faucet />} />
            <Route path="/history" element={<TransactionList />} />

            <Route path="*" element={<Home />} />
          </Routes>
        </div>
      )}
    </div>
  );
};
