import { Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './context/AuthProvider';
import { useAuth } from './context/AuthContext';
import TicketList from './components/TicketList';
import TicketDetail from './components/TicketDetail'; // Страница прохождения билета
import LoginPage from './pages/LoginPage';

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
        {/* Роут для отдельного билета по его _id */}
        <Route
          path='/tickets/:id'
          element={
            <PrivateRoute>
              <TicketDetail />
            </PrivateRoute>
          }
        />
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </AuthProvider>
  );
}