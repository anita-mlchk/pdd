const express = require('express');
const app = express();
const { Ticket } = require('./models');

app.use(express.json());

// 1. GET /tickets (получение всех билетов или с фильтрацией по категории)
app.get('/tickets', async (req, res) => {
  try {
    const { category } = req.query;
    const whereClause = category ? { category } : {};

    const tickets = await Ticket.findAll({ where: whereClause });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении билетов' });
  }
});

// 2. GET /tickets/:id (поиск билета по ID)
app.get('/tickets/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Билет не найден' });
    }
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// 3. POST /tickets (создание билета)
app.post('/tickets', async (req, res) => {
  try {
    const { title, category, questionsCount, timeLimitMinutes, description } = req.body;

    if (!title || !category) {
      return res.status(400).json({ error: 'Поля "title" и "category" обязательны' });
    }

    const newTicket = await Ticket.create({
      title,
      category,
      questionsCount: questionsCount || 20,
      timeLimitMinutes: timeLimitMinutes || 20,
      description: description || ''
    });

    res.status(201).json(newTicket);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при создании билета' });
  }
});

// 4. PUT /tickets/:id (обновление билета)
app.put('/tickets/:id', async (req, res) => {
  try {
    const { title, category, questionsCount, timeLimitMinutes, description } = req.body;

    if (!title || !category) {
      return res.status(400).json({ error: 'Поля "title" и "category" обязательны' });
    }

    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Билет не найден' });
    }

    await ticket.update({
      title,
      category,
      questionsCount: questionsCount || 20,
      timeLimitMinutes: timeLimitMinutes || 20,
      description: description || ''
    });

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при обновлении билета' });
  }
});

// 5. DELETE /tickets/:id (удаление билета)
app.delete('/tickets/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Билет не найден' });
    }

    await ticket.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при удалении билета' });
  }
});

// Глобальная обработка ошибок
app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});