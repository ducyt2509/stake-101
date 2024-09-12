// src/views/ConnectWallet.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import { WalletIcon } from '@heroicons/react/24/outline';
import { useWallet } from '../hooks/useWallet';

export default function ConnectWallet() {
  const [open, setOpen] = useState(true);
  const { networkError, connectWallet, account } = useWallet();
  const navigate = useNavigate();

  const handleConnectClick = async () => {
    console.log('Button clicked');
    await connectWallet();
    if (account) {
      navigate('/'); // Navigate to home page or any page you want after connection
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      className="relative z-10"
    >
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-20 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6"
          >
            <div>
              <div className="text-center p-3">
                <DialogTitle
                  as="h3"
                  className="text-2xl font-bold leading-6 font-sans"
                >
                  BLOCKCHAIN 101
                </DialogTitle>
              </div>
              <div className="flex justify-center items-center my-5 ">
                <img
                  src="https://dexlottery.com/images/lottery/required-connect-wallet.svg"
                  alt="Connect Wallet"
                />
              </div>
            </div>
            <div className="sm:mt-4 flex justify-center items-center">
              <button
                className={`inline-flex w-3/5 justify-center items-center gap-4 rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm ${
                  networkError
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500'
                }`}
                onClick={handleConnectClick}
                disabled={!!networkError}
              >
                <WalletIcon width={22} />
                <span>Connect Your Wallet</span>
              </button>
            </div>

            {networkError && (
              <div className="mt-5">
                <p className="text-sm text-center text-red-500 p-3 bg-gray-300">
                  {networkError}
                </p>
              </div>
            )}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
