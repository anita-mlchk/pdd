import { useAuth } from '../context/AuthContext';

// Показывается только внутри сайта, то есть пользователь уже вошел
export default function UserBar() {
  const { user, logout } = useAuth();

  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '12px 16px', border: '1px solid #e2e8f0',
      marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14,
    }}>
      <span>
        Вы вошли как <b>{user.email}</b> (роль: {user.role})
      </span>
      <button
        onClick={logout}
        style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', color: '#334155', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
      >
        Выйти
      </button>
    </div>
  );
}