import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios'; // или ваш клиент api

export default function TicketDetail() {
  const { id } = useParams(); // получаем _id из URL
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchTicket() {
      try {
        // Запрос к бэкенду за конкретным билетом (убедитесь, что такой эндпоинт есть на бэкенде: GET /api/tickets/:id)
        const token = localStorage.getItem('token'); // или ваш способ передачи токена
        const res = await axios.get(`http://localhost:3000/tickets/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTicket(res.data);
      } catch (err) {
        setError('Не удалось загрузить билет');
      } finally {
        setLoading(false);
      }
    }
    fetchTicket();
  }, [id]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Загрузка билета...</div>;
  if (error) return <div style={{ padding: 40, color: 'red', textAlign: 'center' }}>{error}</div>;
  if (!ticket) return <div style={{ padding: 40, textAlign: 'center' }}>Билет не найден</div>;

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0' }}>
      <button 
        onClick={() => navigate('/')} 
        style={{ marginBottom: 20, padding: '8px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
      >
        ← Назад к списку
      </button>

      <h1 style={{ fontSize: 24, marginBottom: 8 }}>{ticket.title}</h1>
      <p style={{ color: '#64748b', marginBottom: 20 }}>Категория: {ticket.category} | Вопросов: {ticket.questionsCount}</p>

      {/* Список вопросов во вложенном массиве */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {ticket.questions && ticket.questions.map((q, index) => (
          <div key={index} style={{ padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>
              {index + 1}. {q.text}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {q.options.map((opt, optIndex) => (
                <label key={optIndex} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                  <input type='radio' name={`question-${index}`} />
                  {opt.text}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}