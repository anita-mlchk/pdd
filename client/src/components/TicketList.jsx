import { useState, useEffect, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const CATEGORIES = ['A', 'B', 'C', 'D'];

const INITIAL_TICKETS = [
  { id: 1, title: 'Билет 1 (Категория B)', category: 'B', questionsCount: 10, timeLimitMinutes: 15 },
  { id: 2, title: 'Билет 2 (Категория B)', category: 'B', questionsCount: 10, timeLimitMinutes: 15 },
  { id: 3, title: 'Билет 3 (Категория C)', category: 'C', questionsCount: 10, timeLimitMinutes: 20 },
];

const EMPTY_FORM = { title: '', category: 'B', questionsCount: 20, timeLimitMinutes: 20 };

export default function TicketList() {
  const [tickets, setTickets] = useLocalStorage('tickets', INITIAL_TICKETS);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('id');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.title = `Билеты ПДД (${tickets.length})`;
  }, [tickets.length]);

  const visibleTickets = useMemo(() => {
    const filtered = filter === 'all' ? tickets : tickets.filter(t => t.category === filter);
    return [...filtered].sort((a, b) =>
      sortBy === 'title' ? a.title.localeCompare(b.title) : a[sortBy] - b[sortBy]
    );
  }, [tickets, filter, sortBy]);

  const stats = useMemo(() => ({
    total: tickets.length,
    questions: tickets.reduce((sum, t) => sum + t.questionsCount, 0),
    minutes: tickets.reduce((sum, t) => sum + t.timeLimitMinutes, 0),
  }), [tickets]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    const title = form.title.trim();
    const questionsCount = Number(form.questionsCount);
    const timeLimitMinutes = Number(form.timeLimitMinutes);

    if (!title) {
      setError('Введите название билета');
      return;
    }
    if (questionsCount < 1 || timeLimitMinutes < 1) {
      setError('Количество вопросов и время должны быть больше нуля');
      return;
    }
    setError('');

    const data = { title, category: form.category, questionsCount, timeLimitMinutes };

    if (editingId) {
      setTickets(prev => prev.map(t => (t.id === editingId ? { ...t, ...data } : t)));
      setEditingId(null);
    } else {
      setTickets(prev => [...prev, { ...data, id: Date.now() }]);
    }
    setForm(EMPTY_FORM);
  };

  const handleDelete = (id) => {
    setTickets(prev => prev.filter(t => t.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setForm(EMPTY_FORM);
    }
  };

  const handleEdit = (ticket) => {
    setEditingId(ticket.id);
    setError('');
    setForm({
      title: ticket.title,
      category: ticket.category,
      questionsCount: ticket.questionsCount,
      timeLimitMinutes: ticket.timeLimitMinutes,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setError('');
    setForm(EMPTY_FORM);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', color: '#64748b', fontWeight: 500 }}>
        Загрузка приложения...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#eef2f5', padding: '36px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        
        {/* Заголовок */}
        <header style={{ marginBottom: 28, textAlign: 'center' }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            Билеты ПДД
          </h1>
          <p style={{ color: '#64748b', fontSize: 15, margin: 0 }}>
            Управление учебными билетами и подготовка к экзаменам
          </p>
        </header>

        {/* Карточки статистики */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: '16px 20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ color: '#64748b', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Всего билетов</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#0f172a' }}>{stats.total}</div>
          </div>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: '16px 20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ color: '#64748b', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Всего вопросов</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#0f172a' }}>{stats.questions}</div>
          </div>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: '16px 20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ color: '#64748b', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Общее время</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#0f172a' }}>{stats.minutes} <span style={{ fontSize: 14, fontWeight: 400, color: '#64748b' }}>мин</span></div>
          </div>
        </div>

        {/* Понятная форма добавления */}
        <div style={{ background: '#ffffff', borderRadius: 20, padding: 24, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', marginBottom: 28 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 18, color: '#0f172a' }}>
            {editingId ? 'Редактировать билет' : 'Добавить новый билет'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Название */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                Название билета
              </label>
              <input
                name='title'
                placeholder='Например: Билет 4 (Знаки)'
                value={form.title}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', outline: 'none', fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>

            {/* Сетка параметоров: Категория, Вопросы, Время */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                  Категория
                </label>
                <select
                  name='category'
                  value={form.category}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>Категория {c}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                  Кол-во вопросов
                </label>
                <input
                  name='questionsCount'
                  type='number'
                  min='1'
                  placeholder='20'
                  value={form.questionsCount}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', outline: 'none', fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                  Лимит времени (мин)
                </label>
                <input
                  name='timeLimitMinutes'
                  type='number'
                  min='1'
                  placeholder='20'
                  value={form.timeLimitMinutes}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', outline: 'none', fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Кнопки действия */}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                onClick={handleSubmit}
                style={{ padding: '11px 24px', borderRadius: 10, border: 'none', background: '#0f172a', color: '#ffffff', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
              >
                {editingId ? 'Сохранить изменения' : 'Добавить билет'}
              </button>
              {editingId && (
                <button
                  onClick={handleCancel}
                  style={{ padding: '11px 18px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', cursor: 'pointer', fontSize: 14 }}
                >
                  Отмена
                </button>
              )}
            </div>
          </div>

          {error && <div style={{ color: '#ef4444', fontSize: 13, marginTop: 12, fontWeight: 500 }}>{error}</div>}
        </div>

        {/* Фильтрация и сортировка */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Фильтр:</span>
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', fontSize: 13, outline: 'none' }}
            >
              <option value='all'>Все категории</option>
              {CATEGORIES.map(c => <option key={c} value={c}>Категория {c}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Сортировка:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', fontSize: 13, outline: 'none' }}
            >
              <option value='id'>По порядку</option>
              <option value='title'>По названию</option>
              <option value='questionsCount'>По числу вопросов</option>
              <option value='timeLimitMinutes'>По времени</option>
            </select>
          </div>
        </div>

        {/* Список билетов */}
        {visibleTickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', color: '#94a3b8' }}>
            Билеты не найдены
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {visibleTickets.map(t => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#ffffff',
                  borderRadius: 14,
                  padding: '16px 20px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: '#0f172a', marginBottom: 6 }}>
                    {t.title}
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b', display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 6, fontWeight: 600, color: '#334155' }}>
                      Кат. {t.category}
                    </span>
                    <span>{t.questionsCount} вопросов</span>
                    <span>•</span>
                    <span>{t.timeLimitMinutes} минут</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleEdit(t)}
                    style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', cursor: 'pointer', fontWeight: 500, fontSize: 13 }}
                  >
                    Изменить
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontWeight: 500, fontSize: 13 }}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}