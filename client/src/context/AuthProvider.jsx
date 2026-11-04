import { useLocalStorage } from '../hooks/useLocalStorage';
import { AuthContext } from './AuthContext';

export default function AuthProvider({ children }) {
  // данные пользователя сохраняются в localStorage, чтобы вход пережил перезагрузку
  const [user, setUser] = useLocalStorage('user', null);

  // data = { token, user } из ответа сервера
  const login = (data) => {
    localStorage.setItem('token', data.token); // токен читает api.js
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = { user, isAdmin: user?.role === 'admin', login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}