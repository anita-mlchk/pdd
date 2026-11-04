import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {

  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initialValue;
    } catch {
      return initialValue;
    }
  });


  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(key, JSON.stringify(value));
    }, 500);
    return () => clearTimeout(timer);
  }, [key, value]);

  return [value, setValue];
}