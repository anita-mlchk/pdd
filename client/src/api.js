import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000, 
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const login = (email, password) => api.post('/auth/login', { email, password });
export const register = (email, password) => api.post('/auth/register', { email, password });

export const fetchTickets = (search, signal) =>
  api.get('/tickets', { params: search ? { search } : {}, signal });

export const addTicket = (ticket) => api.post('/tickets', ticket);
export const updateTicket = (id, ticket) => api.put(`/tickets/${id}`, ticket);
export const deleteTicket = (id) => api.delete(`/tickets/${id}`);

export function getErrorMessage(err) {
  if (err.response) {
    const data = err.response.data;
    const msg = data?.message || data?.error;
    return msg ? `${msg} (код ${err.response.status})` : `Ошибка сервера (код ${err.response.status})`;
  }
  if (err.request) {
    return 'Сервер недоступен. Проверьте, что он запущен.';
  }
  return err.message;
}