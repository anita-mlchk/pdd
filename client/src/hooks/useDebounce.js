import { useState, useEffect } from 'react';

// Возвращает значение, которое обновляется только после паузы в delay мс
export function useDebounce(value, delay = 500) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer); // пришло новое значение, старый таймер отменяем
  }, [value, delay]);

  return debounced;
}