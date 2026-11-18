import { useLocalStorage } from '../hooks/useLocalStorage';
import { AuthContext } from './AuthContext';

export default function AuthProvider({ children }) {

  const [user, setUser] = useLocalStorage('user', null);


  const login = (data) => {
    localStorage.setItem('token', data.token); 
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = { user, isAdmin: user?.role === 'admin', login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}