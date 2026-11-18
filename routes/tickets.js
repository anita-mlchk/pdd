const express = require('express');
const mongoose = require('mongoose');
const Ticket = require('../models/ticket');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Экранируем спецсимволы, чтобы пользовательский поиск не стал регулярным выражением
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Единая обработка ошибок: ошибки валидации схемы это 400, остальное 500
function handleError(res, error, fallbackMessage) {
  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors).map((e) => e.message).join('; ');
    return res.status(400).json({ error: message });
  }
  console.error(error);
  return res.status(500).json({ error: fallbackMessage });
}

// Проверяем формат id до обращения к базе (иначе Mongoose выбросит CastError)
const checkId = (req, res, next, value) => {
  if (!mongoose.isValidObjectId(value)) {
    return res.status(400).json({ error: 'Некорректный идентификатор' });
  }
  next();
};
router.param('id', checkId);
router.param('questionId', checkId);

// ---------- Агрегация: статистика по категориям ----------
// Маршрут /stats должен стоять ВЫШЕ /:id, иначе "stats" будет принят за id
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await Ticket.aggregate([
      {
        $group: {
          _id: '$category',
          tickets: { $sum: 1 },
          avgTimeLimit: { $avg: '$timeLimitMinutes' },
          totalQuestions: { $sum: '$questionsCount' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          category: '$_id',
          tickets: 1,
          avgTimeLimit: { $round: ['$avgTimeLimit', 1] },
          totalQuestions: 1,
        },
      },
    ]);
    res.json(stats);
  } catch (error) {
    handleError(res, error, 'Ошибка при подсчете статистики');
  }
});

// ---------- CRUD ----------

// GET /tickets: список (без вопросов, чтобы не гонять лишние данные)
// Параметры: ?category=B  ?search=знаки  ?tag=светофор
router.get('/', async (req, res) => {
  try {
    const { category, search, tag } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (tag) filter.tags = tag; // "массив tags содержит значение"
    if (search) filter.title = { $regex: escapeRegex(String(search)), $options: 'i' };

    const tickets = await Ticket.find(filter).select('-questions').sort({ createdAt: 1 });
    res.json(tickets);
  } catch (error) {
    handleError(res, error, 'Ошибка при получении билетов');
  }
});

// GET /tickets/:id: один билет целиком, со всеми вопросами
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Билет не найден' });
    }
    // администратор видит правильные ответы, обычный пользователь нет
    res.json(req.user.role === 'admin' ? ticket : ticket.toPublic());
  } catch (error) {
    handleError(res, error, 'Ошибка сервера');
  }
});

// POST /tickets: создать билет (можно сразу с вопросами и тегами)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { title, category, questionsCount, timeLimitMinutes, description, tags, questions } = req.body;
    const ticket = await Ticket.create({
      title, category, questionsCount, timeLimitMinutes, description, tags, questions,
    });
    res.status(201).json(ticket);
  } catch (error) {
    handleError(res, error, 'Ошибка при создании билета');
  }
});

// PUT /tickets/:id: изменить основные поля билета (вложенные вопросы не трогаем)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const update = {};
    ['title', 'category', 'description', 'questionsCount', 'timeLimitMinutes', 'tags'].forEach((key) => {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    });

    const ticket = await Ticket.findByIdAndUpdate(req.params.id, update, {
      new: true,           // вернуть документ уже после изменения
      runValidators: true, // проверять изменения по правилам схемы
    });
    if (!ticket) {
      return res.status(404).json({ error: 'Билет не найден' });
    }
    res.json(ticket);
  } catch (error) {
    handleError(res, error, 'Ошибка при обновлении билета');
  }
});

// DELETE /tickets/:id: удалить билет и вернуть удаленный документ
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Билет не найден' });
    }
    res.json({ message: 'Билет удален', ticket });
  } catch (error) {
    handleError(res, error, 'Ошибка при удалении билета');
  }
});

// ---------- Вложенные структуры ----------

// POST /tickets/:id/questions: добавить вопрос в массив questions (аналог $push)
router.post('/:id/questions', authenticateToken, isAdmin, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Билет не найден' });
    }
    ticket.questions.push(req.body);
    await ticket.save(); // здесь проверяются правила схемы для вложенного вопроса
    res.status(201).json(ticket);
  } catch (error) {
    handleError(res, error, 'Ошибка при добавлении вопроса');
  }
});

// PUT /tickets/:id/questions/:questionId: изменить вопрос внутри массива
// Позиционный оператор $ означает "тот элемент массива, который нашел фильтр"
router.put('/:id/questions/:questionId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { text, explanation } = req.body;
    const set = {};
    if (text !== undefined) set['questions.$.text'] = text;
    if (explanation !== undefined) set['questions.$.explanation'] = explanation;
    if (Object.keys(set).length === 0) {
      return res.status(400).json({ error: 'Передайте text или explanation' });
    }

    const ticket = await Ticket.findOneAndUpdate(
      { _id: req.params.id, 'questions._id': req.params.questionId },
      { $set: set },
      { new: true, runValidators: true }
    );
    if (!ticket) {
      return res.status(404).json({ error: 'Билет или вопрос не найден' });
    }
    res.json(ticket);
  } catch (error) {
    handleError(res, error, 'Ошибка при изменении вопроса');
  }
});

// DELETE /tickets/:id/questions/:questionId: убрать вопрос из массива ($pull)
router.delete('/:id/questions/:questionId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { $pull: { questions: { _id: req.params.questionId } } },
      { new: true }
    );
    if (!ticket) {
      return res.status(404).json({ error: 'Билет не найден' });
    }
    res.json(ticket);
  } catch (error) {
    handleError(res, error, 'Ошибка при удалении вопроса');
  }
});

// POST /tickets/:id/questions/:questionId/answer: ответить на вопрос
// Тело: { "optionId": "..." }. Счетчики увеличиваются прямо внутри элемента массива ($inc)
router.post('/:id/questions/:questionId/answer', authenticateToken, async (req, res) => {
  try {
    const { optionId } = req.body;
    if (!mongoose.isValidObjectId(optionId)) {
      return res.status(400).json({ error: 'Передайте корректный optionId' });
    }

    // проекция 'questions.$' вернет только найденный вопрос, а не весь массив
    const ticket = await Ticket.findOne(
      { _id: req.params.id, 'questions._id': req.params.questionId },
      { 'questions.$': 1 }
    );
    if (!ticket) {
      return res.status(404).json({ error: 'Билет или вопрос не найден' });
    }

    const question = ticket.questions[0];
    const option = question.options.id(optionId); // поиск вложенного документа по id
    if (!option) {
      return res.status(400).json({ error: 'Такого варианта ответа нет в вопросе' });
    }

    const isCorrect = option.isCorrect;
    await Ticket.updateOne(
      { _id: req.params.id, 'questions._id': req.params.questionId },
      { $inc: { 'questions.$.timesAnswered': 1, 'questions.$.timesCorrect': isCorrect ? 1 : 0 } }
    );

    const correct = question.options.find((o) => o.isCorrect);
    res.json({
      isCorrect,
      correctOptionId: correct ? correct.id : null,
      explanation: question.explanation,
    });
  } catch (error) {
    handleError(res, error, 'Ошибка при проверке ответа');
  }
});

// POST /tickets/:id/tags: добавить тег, дубликаты не создаются ($addToSet)
router.post('/:id/tags', authenticateToken, isAdmin, async (req, res) => {
  try {
    const tag = String(req.body.tag || '').trim();
    if (!tag) {
      return res.status(400).json({ error: 'Передайте непустой tag' });
    }
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { tags: tag } },
      { new: true }
    );
    if (!ticket) {
      return res.status(404).json({ error: 'Билет не найден' });
    }
    res.json(ticket);
  } catch (error) {
    handleError(res, error, 'Ошибка при добавлении тега');
  }
});

module.exports = router;
