const express = require('express');
const app = express();
const { Ticket } = require('./models');

app.use(express.json());

// 1. GET /tickets — получение всех билетов из БД
app.get('/tickets', async (req, res) => {
  try {
    const { category } = req.query;
    const whereClause = category ? { category } : {};
    const tickets = await Ticket.findAll({ where: whereClause });
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении билетов из БД' });
  }
});

// 2. GET /tickets/:id — поиск билета по ID в БД
app.get('/tickets/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: `Билет с ID ${req.params.id} не найден` });
    }
    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка на стороне сервера' });
  }
});

// 3. POST /tickets — создание билета в БД
app.post('/tickets', async (req, res) => {
  try {
    const { title, category, questionsCount, timeLimitMinutes } = req.body;

    if (!title || !category) {
      return res.status(400).json({ error: 'Поля "title" и "category" обязательны' });
    }

    const newTicket = await Ticket.create({
      title,
      category,
      questionsCount: questionsCount || 10,
      timeLimitMinutes: timeLimitMinutes || 15
    });

    res.status(201).json(newTicket);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при создании билета' });
  }
});

// 4. PUT /tickets/:id — обновление билета в БД
app.put('/tickets/:id', async (req, res) => {
  try {
    const { title, category, questionsCount, timeLimitMinutes } = req.body;

    if (!title || !category) {
      return res.status(400).json({ error: 'Поля "title" и "category" обязательны' });
    }

    const ticket = await Ticket.findByPk(req.params.id);

    if (!ticket) {
      return res.status(404).json({ error: `Билет с ID ${req.params.id} не найден` });
    }

    await ticket.update({
      title,
      category,
      questionsCount: questionsCount || 10,
      timeLimitMinutes: timeLimitMinutes || 15
    });

    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при обновлении билета' });
  }
});

// 5. DELETE /tickets/:id — удаление билета из БД
app.delete('/tickets/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);

    if (!ticket) {
      return res.status(404).json({ error: `Билет с ID ${req.params.id} не найден` });
    }

    await ticket.destroy();
    res.status(204).send(); // 204 No Content — стандартный код для успешного удаления без тела ответа
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при удалении билета' });
  }
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Ошибка на стороне сервера' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});