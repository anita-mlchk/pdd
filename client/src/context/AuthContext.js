import { createContext, useContext } from 'react';

// Общее «хранилище» данных об авторизации
export const AuthContext = createContext(null);

// Хук для удобного доступа: const { user, isAdmin, login, logout } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}