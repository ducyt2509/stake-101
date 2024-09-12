import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { WalletIcon } from '@heroicons/react/24/outline';
import { useWallet } from '../hooks/useWallet';
import { convertAddress } from '../utils/convertAddress';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const { account } = useWallet();
  const location = useLocation();

  // Function to check if a link is active
  const isActive = (path) => location.pathname === path;

  return (
    <Disclosure as="nav" className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 rounded">
        <div className="relative flex h-16 justify-between">
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
              <span className="sr-only">Open main menu</span>
              <Bars3Icon
                aria-hidden="true"
                className="block h-6 w-6 group-data-[open]:hidden"
              />
              <XMarkIcon
                aria-hidden="true"
                className="hidden h-6 w-6 group-data-[open]:block"
              />
            </DisclosureButton>
          </div>
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex flex-shrink-0 items-center">
              <img
                alt="Your Company"
                src={'./logo310.png'}
                className="h-8 w-auto"
              />
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                  isActive('/')
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Home
              </Link>
              <Link
                to="/faucet"
                className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                  isActive('/faucet')
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Faucet
              </Link>
            </div>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            <Menu as="div" className="relative ml-3">
              <div>
                <MenuButton className="relative flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                  <span className="sr-only">Open user menu</span>
                  <span className="bg-gray-300 flex justify-center items-center px-3 py-2 rounded-2xl gap-3">
                    <WalletIcon width={22} />
                    <span className="hidden sm:inline-block">
                      {convertAddress(account)}
                    </span>
                  </span>
                </MenuButton>
              </div>
              <MenuItems
                transition
                className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
              >
                <MenuItem>
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700"
                  >
                    Your Profile
                  </Link>
                </MenuItem>
                <MenuItem>
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-sm text-gray-700"
                  >
                    Settings
                  </Link>
                </MenuItem>
                <MenuItem>
                  <Link
                    to="/logout"
                    className="block px-4 py-2 text-sm text-gray-700"
                  >
                    Sign out
                  </Link>
                </MenuItem>
              </MenuItems>
            </Menu>
          </div>
        </div>
      </div>

      <DisclosurePanel className="sm:hidden">
        <div className="space-y-1 pb-4 pt-2">
          <DisclosureButton
            as={Link}
            to="/dashboard"
            className={`block border-l-4 py-2 pl-3 pr-4 text-base font-medium ${
              isActive('/dashboard')
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            Dashboard
          </DisclosureButton>
          <DisclosureButton
            as={Link}
            to="/team"
            className={`block border-l-4 py-2 pl-3 pr-4 text-base font-medium ${
              isActive('/team')
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            Team
          </DisclosureButton>
          <DisclosureButton
            as={Link}
            to="/projects"
            className={`block border-l-4 py-2 pl-3 pr-4 text-base font-medium ${
              isActive('/projects')
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            Projects
          </DisclosureButton>
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}
