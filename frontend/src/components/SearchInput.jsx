import React, { useState, useEffect } from 'react';
import useDebounce from './useDebounce'; // Import custom debounce hook

const SearchInput = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Gọi useDebounce với delay 500ms
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearchTerm) {
      console.log('Debounced value:', debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]); // Chạy effect khi debouncedSearchTerm thay đổi

  return (
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search..."
    />
  );
};

export default SearchInput;
