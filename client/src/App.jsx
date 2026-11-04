import { Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './context/AuthProvider';
import { useAuth } from './context/AuthContext';
import TicketList from './components/TicketList';
import LoginPage from './pages/LoginPage';

// Защищенный маршрут: без входа пускает только на страницу входа
function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to='/login' replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path='/login' element={<LoginPage />} />
        <Route
          path='/'
          element={
            <PrivateRoute>
              <TicketList />
            </PrivateRoute>
          }
        />
        {/* любой неизвестный адрес отправляем на главную (а она сама решит, куда дальше) */}
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </AuthProvider>
  );
}