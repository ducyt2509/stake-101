import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import debounce from 'lodash/debounce';
import { convertAddress } from './../utils/convertAddress';
import { ethers } from 'ethers';

const actionStyles = {
  Mint: 'bg-green-500 px-4 text-white py-1 rounded-full',
  Transfer: 'bg-blue-500 px-4 text-white py-1 rounded-full',
  Burn: 'bg-yellow-500 px-4 text-white py-1 rounded-full',
};

const TransactionList = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('block');
  const [sortOrder, setSortOrder] = useState('asc');

  const fetchTransactions = async (page, searchTerm, sortField, sortOrder) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/stake/0x5404B078f2A1fD03Ff249cD5D4B3DF6683244264`,
        {
          params: {
            index: page,
            size: 10,
            sort: `${sortField}:${sortOrder}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  };

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const { data, pagination } = await fetchTransactions(
        page,
        searchTerm,
        sortField,
        sortOrder,
      );
      setTransactions(data);
      setTotalPages(Math.ceil(pagination.total / pagination.limit));
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, sortField, sortOrder]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchTerm(value);
      setPage(1);
    }, 300),
    [],
  );

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value);
  };

  const handleSortChange = (field) => {
    setSortField(field);
    setSortOrder(field === sortField && sortOrder === 'asc' ? 'desc' : 'asc');
    setPage(1);
  };

  return (
    <div className="container mx-auto mt-10 bg-white shadow-lg p-10 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Transactions</h2>

      <div className="mb-4 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          className="border p-2 w-full rounded-lg"
          placeholder="Search by Transaction Hash, Block, User, Action..."
          onChange={handleSearchChange}
        />

        <div className="flex gap-4">
          <select
            className="border px-4 py-2 rounded-lg"
            value={sortField}
            onChange={(e) => handleSortChange(e.target.value)}
          >
            <option value="block">Block</option>
            <option value="transactionHash">Transaction Hash</option>
            <option value="amount">Amount</option>
            <option value="action">Action</option>
          </select>

          <button
            className="border px-4 py-2 rounded-lg"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          </button>
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="min-w-full table-auto border">
          <thead>
            <tr>
              <th className="border px-4 py-3 text-center">Block</th>
              <th className="border px-4 py-3 text-center">Transaction Hash</th>
              <th className="border px-4 py-3 text-center">Action</th>
              <th className="border px-4 py-3 text-center">Total Amount</th>
              <th className="border px-4 py-3 text-center">Attributes</th>
              <th className="border px-4 py-3 text-center">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="4" className="border px-4 py-3 text-center">
                  No transactions found
                </td>
              </tr>
            ) : (
              transactions.map((tx, index) => (
                <tr
                  key={tx.transactionHash}
                  className={index % 2 === 0 ? 'bg-gray-100' : 'bg-white'}
                >
                  <td className="border px-4 py-3 text-center">{tx.block}</td>
                  <td className="border px-4 py-3 text-center">
                    {convertAddress(tx.transactionHash)}
                  </td>
                  <td className="border px-4 py-3 text-center">
                    {convertAddress(tx.action)}
                  </td>
                  <td className="border px-4 py-3 text-center">
                    {tx.totalAmount} ETH
                  </td>
                  <td className="border px-4 py-3 text-center">
                    {new Date(tx.timestamp * 1000).toLocaleString()}
                  </td>
                  <td className="border px-4 py-3 text-center">
                    {Object.entries(tx.attributes).map(([key, value]) => (
                      <div key={key}>{`${key}: ${value}`}</div>
                    ))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center">
          <button
            className="border p-2 mx-1 rounded-lg px-4 bg-blue-500 text-white"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </button>
          <div className="mx-2">
            {new Array(totalPages).fill(0).map((_, index) => (
              <button
                key={index}
                className={`border p-2 mx-1 rounded-lg px-4 ${
                  page === index + 1 ? 'bg-blue-500 text-white' : 'bg-white'
                }`}
                onClick={() => setPage(index + 1)}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <button
            className="border p-2 mx-1 rounded-lg px-4 bg-blue-500 text-white"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
