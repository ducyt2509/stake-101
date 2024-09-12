import { useState, useEffect } from 'react';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Dọn dẹp timeout khi component unmount hoặc giá trị thay đổi
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Chạy lại effect khi value hoặc delay thay đổi

  return debouncedValue;
}

export default useDebounce;
