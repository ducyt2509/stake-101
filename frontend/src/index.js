import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'react-toastify/dist/ReactToastify.css';
import { MainLayout } from './views/MainLayout';
import { ToastContainer } from 'react-toastify';
import { BrowserRouter as Router } from 'react-router-dom';
import { ChainList } from './utils/chainlist';
import { WalletProvider } from './hooks/useWallet';

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <WalletProvider chainInfo={ChainList.LineaSepolia}>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <Router>
        <MainLayout />
      </Router>
    </WalletProvider>,
  );
} else {
  console.error('Root element not found');
}
