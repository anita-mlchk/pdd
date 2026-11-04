import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { login as loginRequest, register as registerRequest, getErrorMessage } from '../api';
import { useAuth } from '../context/AuthContext';

const fieldStyle = { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid #cbd5e1', outline: 'none', fontSize: 14, boxSizing: 'border-box' };
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 };

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' или 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = 'Вход — Билеты ПДД';
  }, []);

  // Уже вошли: на странице входа делать нечего, отправляем на сайт
  if (user) return <Navigate to='/' replace />;

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setError('Заполните email и пароль');
      return;
    }
    setBusy(true);
    setError('');
    try {
      // при регистрации сначала создаем пользователя, затем сразу входим
      if (mode === 'register') await registerRequest(email.trim(), password);
      const res = await loginRequest(email.trim(), password);
      login(res.data);   // сохраняем токен и пользователя
      navigate('/');     // переходим на сайт со списком билетов
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#eef2f5', padding: '36px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#ffffff', borderRadius: 20, padding: 28, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
          {mode === 'login' ? 'Вход' : 'Регистрация'}
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 22px 0' }}>
          {mode === 'login'
            ? 'Войдите, чтобы управлять билетами ПДД'
            : 'Создайте аккаунт, после регистрации вход выполнится автоматически'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              style={fieldStyle}
              type='email'
              placeholder='admin@test.com'
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div>
            <label style={labelStyle}>Пароль</label>
            <input
              style={fieldStyle}
              type='password'
              placeholder='Введите пароль'
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          {error && <div style={{ color: '#ef4444', fontSize: 13, fontWeight: 500 }}>{error}</div>}

          <button
            onClick={handleSubmit}
            disabled={busy}
            style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: '#0f172a', color: '#ffffff', fontWeight: 600, cursor: busy ? 'default' : 'pointer', fontSize: 14, opacity: busy ? 0.7 : 1 }}
          >
            {busy ? 'Подождите...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </div>

        <div style={{ marginTop: 20, fontSize: 14, color: '#64748b', textAlign: 'center' }}>
          {mode === 'login' ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
          <button
            onClick={switchMode}
            style={{ background: 'none', border: 'none', color: '#0f172a', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: 14 }}
          >
            {mode === 'login' ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </div>
      </div>
    </div>
  );
}