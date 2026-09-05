const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware: учим Express автоматически понимать входящий JSON в теле запросов
app.use(express.json());

// Наша временная «база данных» в памяти (массив объектов)
let tickets = [
  {
    id: 1,
    title: 'Билет №1 (Категория B)',
    category: 'B',
    questionsCount: 10,
    timeLimitMinutes: 15,
    description: 'Основы ПДД, проезд перекрестков, дорожная разметка'
  },
  {
    id: 2,
    title: 'Билет №2 (Категория B)',
    category: 'B',
    questionsCount: 10,
    timeLimitMinutes: 15,
    description: 'Знаки приоритета, обгон и маневрирование'
  },
  {
    id: 3,
    title: 'Билет №1 (Категория C)',
    category: 'C',
    questionsCount: 10,
    timeLimitMinutes: 20,
    description: 'Специфика управления грузовым транспортом'
  }
];

// 1. GET /tickets — Получить все билеты (или отфильтровать по категории ?category=B)
app.get('/tickets', (req, res) => {
  const { category } = req.query;
  if (category) {
    const filtered = tickets.filter(t => t.category.toLowerCase() === category.toLowerCase());
    return res.status(200).json(filtered);
  }
  res.status(200).json(tickets);
});

// 2. GET /tickets/:id — Получить один билет по ID
app.get('/tickets/:id', (req, res) => {
  const ticketId = parseInt(req.params.id, 10);
  const ticket = tickets.find(t => t.id === ticketId);

  if (!ticket) {
    return res.status(404).json({ error: `Билет с ID ${ticketId} не найден` });
  }

  res.status(200).json(ticket);
});

// 3. POST /tickets — Создать новый билет
app.post('/tickets', (req, res) => {
  const { title, category, questionsCount, timeLimitMinutes, description } = req.body;

  if (!title || !category) {
    return res.status(400).json({ error: 'Поля "title" и "category" обязательны' });
  }

  const newTicket = {
    id: tickets.length > 0 ? Math.max(...tickets.map(t => t.id)) + 1 : 1,
    title,
    category,
    questionsCount: questionsCount || 10,
    timeLimitMinutes: timeLimitMinutes || 15,
    description: description || ''
  };

  tickets.push(newTicket);
  res.status(201).json(newTicket);
});

// 4. PUT /tickets/:id — Обновить билет целиком
app.put('/tickets/:id', (req, res) => {
  const ticketId = parseInt(req.params.id, 10);
  const ticketIndex = tickets.findIndex(t => t.id === ticketId);

  if (ticketIndex === -1) {
    return res.status(404).json({ error: `Билет с ID ${ticketId} не найден` });
  }

  const { title, category, questionsCount, timeLimitMinutes, description } = req.body;

  if (!title || !category) {
    return res.status(400).json({ error: 'Поля "title" и "category" обязательны при PUT' });
  }

  tickets[ticketIndex] = {
    id: ticketId,
    title,
    category,
    questionsCount: questionsCount || 10,
    timeLimitMinutes: timeLimitMinutes || 15,
    description: description || ''
  };

  res.status(200).json(tickets[ticketIndex]);
});

// 5. DELETE /tickets/:id — Удалить билет
app.delete('/tickets/:id', (req, res) => {
  const ticketId = parseInt(req.params.id, 10);
  const ticketIndex = tickets.findIndex(t => t.id === ticketId);

  if (ticketIndex === -1) {
    return res.status(404).json({ error: `Билет с ID ${ticketId} не найден` });
  }

  tickets.splice(ticketIndex, 1);
  res.status(200).json({ message: `Билет с ID ${ticketId} успешно удален` });
});

// Обработка несуществующих маршрутов (404)
app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Ошибка на стороне сервера' });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});