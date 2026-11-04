import { useState, useEffect, useMemo } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { useAuth } from '../context/AuthContext';
import { fetchTickets, addTicket, updateTicket, deleteTicket, getErrorMessage } from '../api';
import UserBar from './UserBar';

const CATEGORIES = ['A', 'B', 'C', 'D'];
const EMPTY_FORM = { title: '', category: 'B', questionsCount: 20, timeLimitMinutes: 20 };

// Общие стили, чтобы не повторять их в разметке
const cardStyle = { background: '#ffffff', borderRadius: 16, padding: '16px 20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' };
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 };
const fieldStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', outline: 'none', fontSize: 14, boxSizing: 'border-box' };
const smallSelect = { padding: '7px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', fontSize: 13, outline: 'none' };
const statLabel = { color: '#64748b', fontSize: 13, fontWeight: 500, marginBottom: 4 };
const statValue = { fontSize: 26, fontWeight: 700, color: '#0f172a' };

export default function TicketList() {
  // ---- кто вошел (из контекста) ----
  const { isAdmin } = useAuth();

  // ---- данные с сервера и состояния запроса ----
  const [tickets, setTickets] = useState([]);       // начинаем с пустого массива
  const [loading, setLoading] = useState(true);     // идет ли загрузка списка
  const [loadError, setLoadError] = useState('');   // ошибка загрузки списка
  const [reloadKey, setReloadKey] = useState(0);    // счетчик для кнопки «Повторить»
  const [notice, setNotice] = useState('');         // уведомление об ошибке операции

  // ---- поиск на сервере ----
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search.trim(), 500);

  // ---- форма, фильтр, сортировка ----
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('id');
  const [error, setError] = useState('');           // ошибка валидации формы

  // Эффект 1: загрузка списка с сервера.
  // Срабатывает при старте, при изменении поиска и по кнопке «Повторить»
  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setLoadError('');
      try {
        const res = await fetchTickets(debouncedSearch, controller.signal);
        setTickets(res.data);
      } catch (err) {
        if (controller.signal.aborted) return; // мы сами отменили запрос, это не ошибка
        setLoadError(getErrorMessage(err));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort(); // cleanup: отменяем устаревший запрос
  }, [debouncedSearch, reloadKey]);

  // Эффект 2: заголовок вкладки
  useEffect(() => {
    document.title = `Билеты ПДД (${tickets.length})`;
  }, [tickets.length]);

  // Эффект 3: уведомление исчезает само через 4 секунды
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

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

  // ---- CRUD с оптимистичным обновлением ----
  const handleAdd = async (data) => {
    const tempId = Date.now();
    // 1. сразу показываем билет (pending = ждет ответа сервера)
    setTickets(prev => [...prev, { ...data, id: tempId, pending: true }]);
    try {
      // 2. отправляем на сервер
      const res = await addTicket(data);
      // 3. успех: заменяем временный билет настоящим (с реальным id из БД)
      setTickets(prev => prev.map(t => (t.id === tempId ? res.data : t)));
    } catch (err) {
      // 4. ошибка: откат и уведомление
      setTickets(prev => prev.filter(t => t.id !== tempId));
      setNotice(`Не удалось добавить билет: ${getErrorMessage(err)}`);
    }
  };

  const handleUpdate = async (id, data) => {
    const previous = tickets.find(t => t.id === id); // старая версия для отката
    setTickets(prev => prev.map(t => (t.id === id ? { ...t, ...data } : t)));
    try {
      const res = await updateTicket(id, data);
      setTickets(prev => prev.map(t => (t.id === id ? res.data : t)));
    } catch (err) {
      setTickets(prev => prev.map(t => (t.id === id ? previous : t)));
      setNotice(`Не удалось изменить билет: ${getErrorMessage(err)}`);
    }
  };

  const handleDelete = async (id) => {
    const index = tickets.findIndex(t => t.id === id);
    const removed = tickets[index];              // запоминаем билет и его место
    setTickets(prev => prev.filter(t => t.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setForm(EMPTY_FORM);
    }
    try {
      await deleteTicket(id);
    } catch (err) {
      // откат: возвращаем билет на прежнее место
      setTickets(prev => {
        const copy = [...prev];
        copy.splice(Math.min(index, copy.length), 0, removed);
        return copy;
      });
      setNotice(`Не удалось удалить билет: ${getErrorMessage(err)}`);
    }
  };

  // ---- форма ----
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
      handleUpdate(editingId, data);
      setEditingId(null);
    } else {
      handleAdd(data);
    }
    setForm(EMPTY_FORM);
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

        {/* Кто вошел и кнопка «Выйти» */}
        <UserBar />

        {/* Уведомление об ошибке операции */}
        {notice && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 14 }}>
            {notice}
          </div>
        )}

        {/* Карточки статистики */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
          <div style={cardStyle}>
            <div style={statLabel}>Всего билетов</div>
            <div style={statValue}>{stats.total}</div>
          </div>
          <div style={cardStyle}>
            <div style={statLabel}>Всего вопросов</div>
            <div style={statValue}>{stats.questions}</div>
          </div>
          <div style={cardStyle}>
            <div style={statLabel}>Общее время</div>
            <div style={statValue}>{stats.minutes} <span style={{ fontSize: 14, fontWeight: 400, color: '#64748b' }}>мин</span></div>
          </div>
        </div>

        {/* Форма добавления / редактирования: только для администратора */}
        {isAdmin ? (
          <div style={{ background: '#ffffff', borderRadius: 20, padding: 24, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', marginBottom: 28 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 18, color: '#0f172a' }}>
              {editingId ? 'Редактировать билет' : 'Добавить новый билет'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Название билета</label>
                <input
                  name='title'
                  placeholder='Например: Билет 4 (Знаки)'
                  value={form.title}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  style={fieldStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Категория</label>
                  <select name='category' value={form.category} onChange={handleChange} style={{ ...fieldStyle, background: '#fff' }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>Категория {c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Кол-во вопросов</label>
                  <input
                    name='questionsCount'
                    type='number'
                    min='1'
                    placeholder='20'
                    value={form.questionsCount}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    style={fieldStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Лимит времени (мин)</label>
                  <input
                    name='timeLimitMinutes'
                    type='number'
                    min='1'
                    placeholder='20'
                    value={form.timeLimitMinutes}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    style={fieldStyle}
                  />
                </div>
              </div>

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
        ) : (
          <div style={{ ...cardStyle, marginBottom: 28, color: '#475569', fontSize: 14 }}>
            Вы вошли как обычный пользователь: билеты доступны для просмотра. Для добавления, изменения и удаления нужна роль администратора.
          </div>
        )}

        {/* Поиск на сервере */}
        <input
          placeholder='Поиск по названию'
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...fieldStyle, marginBottom: 14 }}
        />

        {/* Фильтр и сортировка */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Фильтр:</span>
            <select value={filter} onChange={e => setFilter(e.target.value)} style={smallSelect}>
              <option value='all'>Все категории</option>
              {CATEGORIES.map(c => <option key={c} value={c}>Категория {c}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Сортировка:</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={smallSelect}>
              <option value='id'>По порядку</option>
              <option value='title'>По названию</option>
              <option value='questionsCount'>По числу вопросов</option>
              <option value='timeLimitMinutes'>По времени</option>
            </select>
          </div>
        </div>

        {/* Список: загрузка, ошибка, пусто или карточки */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
            <div className='spinner' />
            Загрузка билетов с сервера...
          </div>
        ) : loadError ? (
          <div style={{ textAlign: 'center', padding: 32, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 16, color: '#b91c1c' }}>
            <div style={{ marginBottom: 14, fontWeight: 600 }}>{loadError}</div>
            <button
              onClick={() => setReloadKey(k => k + 1)}
              style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: '#0f172a', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
            >
              Повторить
            </button>
          </div>
        ) : visibleTickets.length === 0 ? (
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
                  opacity: t.pending ? 0.6 : 1,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: '#0f172a', marginBottom: 6 }}>
                    {t.title}{' '}
                    {t.pending && <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: 12 }}>(сохраняется...)</span>}
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

                {/* Кнопки управления: только администратору */}
                {isAdmin && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleEdit(t)}
                      disabled={t.pending}
                      style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', cursor: 'pointer', fontWeight: 500, fontSize: 13 }}
                    >
                      Изменить
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      disabled={t.pending}
                      style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontWeight: 500, fontSize: 13 }}
                    >
                      Удалить
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}