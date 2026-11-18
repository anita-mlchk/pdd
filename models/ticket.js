const mongoose = require('mongoose');

// Превращаем _id в id и убираем служебное поле __v,
// чтобы React-клиент продолжал работать с полем id, как и с PostgreSQL
function cleanJSON(doc, ret) {
  if (ret._id) {
    ret.id = ret._id.toString();
    delete ret._id;
  }
  delete ret.__v;
  return ret;
}

// Вложенный документ 1: вариант ответа
const optionSchema = new mongoose.Schema({
  text: { type: String, required: [true, 'Текст варианта ответа обязателен'], trim: true },
  isCorrect: { type: Boolean, default: false },
});

// Вложенный документ 2: вопрос билета (внутри него массив вариантов ответа)
const questionSchema = new mongoose.Schema({
  text: { type: String, required: [true, 'Текст вопроса обязателен'], trim: true },
  options: {
    type: [optionSchema],
    validate: [(arr) => arr.length >= 2, 'У вопроса должно быть минимум 2 варианта ответа'],
  },
  explanation: { type: String, default: '' },
  timesAnswered: { type: Number, default: 0 }, // сколько раз отвечали
  timesCorrect: { type: Number, default: 0 },  // сколько раз ответили верно
});

// Основная схема: билет ПДД. Вопросы лежат ВНУТРИ документа билета
const ticketSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Название обязательно'], trim: true },
    category: {
      type: String,
      required: [true, 'Категория обязательна'],
      enum: { values: ['A', 'B', 'C', 'D'], message: 'Категория должна быть A, B, C или D' },
    },
    description: { type: String, default: '' },
    questionsCount: { type: Number, default: 20, min: [1, 'Минимум 1 вопрос'] },
    timeLimitMinutes: { type: Number, default: 20, min: [1, 'Минимум 1 минута'] },
    tags: [String],             // массив строк
    questions: [questionSchema] // массив вложенных документов
  },
  { timestamps: true } // createdAt и updatedAt добавятся автоматически
);

// Индексы: ускоряют поиск по названию и по тегам
ticketSchema.index({ title: 1 });
ticketSchema.index({ tags: 1 });

// Метод экземпляра: версия билета для обычного пользователя без правильных ответов
ticketSchema.methods.toPublic = function () {
  const obj = this.toJSON();
  obj.questions = (obj.questions || []).map((q) => ({
    ...q,
    options: q.options.map((o) => ({ id: o.id, text: o.text })),
  }));
  return obj;
};

// Статический метод модели: все билеты категории
ticketSchema.statics.findByCategory = function (category) {
  return this.find({ category }).sort({ createdAt: 1 });
};

ticketSchema.set('toJSON', { transform: cleanJSON });
questionSchema.set('toJSON', { transform: cleanJSON });
optionSchema.set('toJSON', { transform: cleanJSON });

module.exports = mongoose.model('Ticket', ticketSchema);
