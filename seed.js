require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Ticket = require('./models/ticket');
// Если у вас есть модель User, импортируем её. Если нет, создадим напрямую через mongoose-соединение:
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: 'user' }
});
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function seedDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected for seeding');

    // Очищаем коллекции
    await Ticket.deleteMany({});
    await User.deleteMany({});

    // Создаем тестовых пользователей (пароль: 123456)
    const passwordHash = await bcrypt.hash('123456', 10);
    const admin = await User.create({
      email: 'admin@test.com',
      passwordHash,
      role: 'admin',
    });

    await User.create({
      email: 'user@test.com',
      passwordHash,
      role: 'user',
    });

    // Создаем 5 билетов ПДД с вложенными вопросами
    const tickets = [
      {
        title: 'Билет №1',
        category: 'B',
        description: 'Общие положения, обязанности водителей',
        questionsCount: 2,
        timeLimitMinutes: 20,
        tags: ['основные', 'обязанности'],
        questions: [
          {
            text: 'Разрешается ли эксплуатация легкового автомобиля при наличии неисправности рабочей тормозной системы?',
            explanation: 'Пункт 7.1 Перечня неисправностей запрещает эксплуатацию транспортных средств при неисправности тормозной системы.',
            options: [
              { text: 'Разрешается', isCorrect: false },
              { text: 'Запрещается', isCorrect: true }
            ]
          },
          {
            text: 'Кто имеет преимущество в движении на нерегулируемом перекрестке равнозначных дорог?',
            explanation: 'При движении на равнозначном перекрестке водитель обязан уступить дорогу транспортным средствам, приближающимся справа.',
            options: [
              { text: 'Транспортное средство, приближающееся справа', isCorrect: true },
              { text: 'Транспортное средство слева', isCorrect: false }
            ]
          }
        ]
      },
      {
        title: 'Билет №2',
        category: 'B',
        description: 'Дорожные знаки и их действие',
        questionsCount: 2,
        timeLimitMinutes: 20,
        tags: ['знаки', 'приоритет'],
        questions: [
          {
            text: 'Что обозначает данный дорожный знак (треугольник)?',
            explanation: 'Треугольник вершиной вниз обязывает уступить дорогу.',
            options: [
              { text: 'Главная дорога', isCorrect: false },
              { text: 'Уступите дорогу', isCorrect: true }
            ]
          }
        ]
      },
      {
        title: 'Билет №3',
        category: 'B',
        description: 'Скоростной режим',
        questionsCount: 1,
        timeLimitMinutes: 20,
        tags: ['скорость'],
        questions: [
          {
            text: 'Какова максимальная скорость движения в населенных пунктах?',
            explanation: 'В населенных пунктах разрешается движение не более 60 км/ч.',
            options: [
              { text: '50 км/ч', isCorrect: false },
              { text: '60 км/ч', isCorrect: true }
            ]
          }
        ]
      },
      {
        title: 'Билет №4',
        category: 'B',
        description: 'Остановка и стоянка',
        questionsCount: 1,
        timeLimitMinutes: 20,
        tags: ['парковка'],
        questions: [
          {
            text: 'На каком расстоянии от пешеходного перехода разрешается остановка?',
            explanation: 'Не ближе 5 метров перед пешеходным переходом.',
            options: [
              { text: 'Непосредственно перед переходом', isCorrect: false },
              { text: 'Не ближе 5 метров', isCorrect: true }
            ]
          }
        ]
      },
      {
        title: 'Билет №5',
        category: 'B',
        description: 'Сигналы светофора',
        questionsCount: 1,
        timeLimitMinutes: 20,
        tags: ['светофор'],
        questions: [
          {
            text: 'Что означает желтый мигающий сигнал светофора?',
            explanation: 'Разрешает движение и информирует о нерегулируемом перекрестке.',
            options: [
              { text: 'Запрещает движение', isCorrect: false },
              { text: 'Разрешает движение и информирует о нерегулируемом перекрестке', isCorrect: true }
            ]
          }
        ]
      }
    ];

    await Ticket.insertMany(tickets);
    console.log('🌱 Успешно создано пользователей: 2 и билетов: 5');
    process.exit(0);
  } catch (err) {
    console.error('❌ Ошибка при заполнении базы:', err);
    process.exit(1);
  }
}

seedDB();