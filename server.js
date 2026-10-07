require('dotenv').config();
const express = require('express');

if (!process.env.JWT_SECRET) {
  console.error('Ошибка: не задан JWT_SECRET. Проверьте файл .env в корне проекта.');
  process.exit(1);
}

const app = express();
const { Ticket } = require('./models');
const { authenticateToken, isAdmin } = require('./middleware/auth');

app.use(express.json());

app.use('/auth', require('./routes/auth'));   // /auth/register, /auth/login
app.use('/', require('./routes/users'));      // /profile, /admin/users

app.get('/tickets', async (req, res) => {
  try {
    const { category } = req.query;
    const whereClause = category ? { category } : {};

    const tickets = await Ticket.findAll({ where: whereClause });
    res.json(tickets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка при получении билетов' });
  }
});

app.get('/tickets/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Билет не найден' });
    }
    res.json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/tickets', authenticateToken, isAdmin, async (req, res) => {
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
    console.error(error);
    res.status(500).json({ error: 'Ошибка при создании билета' });
  }
});

app.put('/tickets/:id', authenticateToken, isAdmin, async (req, res) => {
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
    console.error(error);
    res.status(500).json({ error: 'Ошибка при обновлении билета' });
  }
});

app.delete('/tickets/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Билет не найден' });
    }

    await ticket.destroy();
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка при удалении билета' });
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});