import { useState } from 'react';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Tabs({ tabs, onTabClick }) {
  const [currentTab, setCurrentTab] = useState(
    tabs.find((tab) => tab.current) || tabs[0],
  );

  const handleTabClick = (tab) => {
    setCurrentTab(tab);
    onTabClick(tab); // Gọi hàm onTabClick khi nhấn vào tab
  };

  return (
    <div>
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        <select
          id="tabs"
          name="tabs"
          value={currentTab.name}
          onChange={(e) =>
            handleTabClick(tabs.find((tab) => tab.name === e.target.value))
          }
          className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
        >
          {tabs.map((tab) => (
            <option key={tab.name}>{tab.name}</option>
          ))}
        </select>
      </div>
      <div className="hidden sm:block">
        <nav aria-label="Tabs" className="flex space-x-4">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => handleTabClick(tab)}
              className={classNames(
                currentTab.name === tab.name
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-500 hover:text-gray-700',
                'rounded-md px-3 py-2 text-sm font-medium',
              )}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
