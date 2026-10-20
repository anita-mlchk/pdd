import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
  // Ленивая инициализация: функция выполнится один раз при первом рендере
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initialValue; // если данных нет, берем начальные
    } catch {
      return initialValue;
    }
  });

  // Сохранение при каждом изменении с debounce 500 мс
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(key, JSON.stringify(value));
    }, 500);
    return () => clearTimeout(timer); // cleanup: отменяем таймер, если value изменилось снова
  }, [key, value]);

  return [value, setValue];
}