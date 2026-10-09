// lang-backend/controllers/aiConversationController.js
const pool = require('../db/db');
const logger = require('../utils/logger');
const Groq = require('groq-sdk');

// Начать новую разговорную практику с AI
exports.startConversation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { language, topic, course_id, lesson_id } = req.body;

    if (!language) {
      return res.status(400).json({ message: "Язык обязателен" });
    }

    // Получаем metadata из тела запроса
    const metadata = req.body.metadata || {};
    
    // Создаем новую беседу
    const result = await pool.query(`
      INSERT INTO ai_conversations 
      (user_id, course_id, lesson_id, language, topic, messages, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      userId,
      course_id || null,
      lesson_id || null,
      language,
      topic || null,
      JSON.stringify([{
        role: 'system',
        content: `Вы - дружелюбный AI-репетитор для изучения ${language}. Начните разговор на тему "${topic || 'общая беседа'}". Говорите просто и понятно, адаптируйтесь к уровню пользователя.`
      }]),
      JSON.stringify(metadata)
    ]);

    // Генерируем первое сообщение от AI
    const firstMessage = generateFirstMessage(language, topic);

    // Обновляем беседу с первым сообщением
    const messages = [
      {
        role: 'system',
        content: `Вы - дружелюбный AI-репетитор для изучения ${language}.`
      },
      {
        role: 'assistant',
        content: firstMessage,
        timestamp: new Date().toISOString()
      }
    ];

    await pool.query(`
      UPDATE ai_conversations
      SET messages = $1
      WHERE id = $2
    `, [JSON.stringify(messages), result.rows[0].id]);

    res.status(201).json({
      conversationId: result.rows[0].id,
      message: firstMessage,
      language,
      topic: topic || 'Общая беседа'
    });
  } catch (err) {
    logger.error("Ошибка начала разговора", { error: err });
    next(err);
  }
};

// Отправить сообщение в разговор
exports.sendMessage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // conversationId берется из параметров URL, message - из тела запроса
    const conversationId = parseInt(req.params.conversationId);
    const { message, audioData } = req.body;

    if (!conversationId || isNaN(conversationId)) {
      return res.status(400).json({ message: "conversationId обязателен и должен быть числом" });
    }
    
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ message: "message обязателен и не должен быть пустым" });
    }

    // Проверяем, что беседа принадлежит пользователю
    const conversation = await pool.query(`
      SELECT * FROM ai_conversations
      WHERE id = $1 AND user_id = $2
    `, [conversationId, userId]);

    if (conversation.rows.length === 0) {
      return res.status(404).json({ message: "Беседа не найдена" });
    }

    // Парсим messages из JSONB
    let currentMessages = [];
    try {
      currentMessages = typeof conversation.rows[0].messages === 'string'
        ? JSON.parse(conversation.rows[0].messages)
        : (conversation.rows[0].messages || []);
    } catch (e) {
      logger.warn("Ошибка парсинга messages", { error: e });
      currentMessages = [];
    }
    
    // Парсим metadata из JSONB
    let metadata = {};
    try {
      metadata = typeof conversation.rows[0].metadata === 'string' 
        ? JSON.parse(conversation.rows[0].metadata)
        : (conversation.rows[0].metadata || {});
    } catch (e) {
      logger.warn("Ошибка парсинга metadata", { error: e });
      metadata = {};
    }

    // Добавляем сообщение пользователя
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      ...(audioData && { audioData })
    };

    currentMessages.push(userMessage);
    
    // Генерируем ответ AI (передаем currentMessages, который уже содержит userMessage)
    const aiResponse = await generateAIResponse(
      message,
      conversation.rows[0].language,
      conversation.rows[0].topic,
      currentMessages, // Уже содержит userMessage
      metadata
    );

    // Добавляем ответ AI
    const assistantMessage = {
      role: 'assistant',
      content: aiResponse.text,
      feedback: aiResponse.feedback,
      corrections: aiResponse.corrections,
      timestamp: new Date().toISOString()
    };

    currentMessages.push(assistantMessage);

    // Обновляем беседу
    await pool.query(`
      UPDATE ai_conversations
      SET messages = $1
      WHERE id = $2
    `, [JSON.stringify(currentMessages), conversationId]);

    // Убеждаемся, что ответ всегда есть
    const conversationLanguage = conversation.rows[0].language;
    const finalResponse = aiResponse?.text || (conversationLanguage === 'english' 
      ? "I'm here! Let's continue our conversation! What would you like to talk about?"
      : conversationLanguage === 'russian'
      ? "Я здесь! Давай продолжим разговор! О чем хочешь поговорить?"
      : "Мен мұндамын! Әңгімені жалғастырайық! Не туралы сөйлесуді қалайсың?");

    // Логируем для отладки
    logger.info("AI response sent", {
      conversationId,
      userMessage: message.substring(0, 50),
      responseLength: finalResponse.length,
      hasFeedback: !!aiResponse?.feedback,
      friendId: metadata?.friendId,
      language: conversationLanguage
    });

    res.json({
      response: finalResponse,
      feedback: aiResponse?.feedback || null,
      corrections: aiResponse?.corrections || [],
      suggestions: aiResponse?.suggestions || []
    });
  } catch (err) {
    logger.error("Ошибка отправки сообщения", { error: err });
    next(err);
  }
};

// Завершить разговор и получить оценку
exports.endConversation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    const conversation = await pool.query(`
      SELECT * FROM ai_conversations
      WHERE id = $1 AND user_id = $2
    `, [conversationId, userId]);

    if (conversation.rows.length === 0) {
      return res.status(404).json({ message: "Беседа не найдена" });
    }

    // Парсим messages из JSONB
    let messages = [];
    try {
      messages = typeof conversation.rows[0].messages === 'string'
        ? JSON.parse(conversation.rows[0].messages)
        : (conversation.rows[0].messages || []);
    } catch (e) {
      logger.warn("Ошибка парсинга messages", { error: e });
      messages = [];
    }
    
    const userMessages = messages.filter(m => m.role === 'user');

    // Вычисляем длительность
    const startTime = new Date(conversation.rows[0].created_at);
    const endTime = new Date();
    const durationSeconds = Math.floor((endTime - startTime) / 1000);

    // Генерируем оценку и обратную связь
    const evaluation = evaluateConversation(messages, conversation.rows[0].language);

    // Обновляем беседу
    await pool.query(`
      UPDATE ai_conversations
      SET duration_seconds = $1, score = $2, feedback = $3
      WHERE id = $4
    `, [
      durationSeconds,
      evaluation.score,
      evaluation.feedback,
      conversationId
    ]);

    res.json({
      score: evaluation.score,
      feedback: evaluation.feedback,
      duration: durationSeconds,
      statistics: {
        messagesCount: userMessages.length,
        averageResponseLength: evaluation.averageLength
      }
    });
  } catch (err) {
    logger.error("Ошибка завершения разговора", { error: err });
    next(err);
  }
};

// Получить историю разговоров
exports.getConversationHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    const conversations = await pool.query(`
      SELECT 
        id,
        language,
        topic,
        score,
        duration_seconds,
        created_at,
        (SELECT COUNT(*) FROM jsonb_array_elements(messages) WHERE value->>'role' = 'user') as message_count
      FROM ai_conversations
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `, [userId, limit]);

    res.json(conversations.rows);
  } catch (err) {
    logger.error("Ошибка получения истории", { error: err });
    next(err);
  }
};

// Генерация первого сообщения
function generateFirstMessage(language, topic) {
  const greetings = {
    'english': 'Hello! How are you today?',
    'russian': 'Привет! Как дела?',
    'kazakh': 'Сәлем! Қалыңыз қалай?',
    'spanish': '¡Hola! ¿Cómo estás?'
  };

  const topicMessages = {
    'english': {
      'travel': 'Let\'s talk about travel! Where would you like to visit?',
      'food': 'Let\'s discuss food! What\'s your favorite dish?',
      'hobbies': 'Tell me about your hobbies! What do you like to do in your free time?'
    },
    'russian': {
      'travel': 'Давайте поговорим о путешествиях! Куда бы вы хотели поехать?',
      'food': 'Давайте обсудим еду! Какое ваше любимое блюдо?',
      'hobbies': 'Расскажите о своих хобби! Чем вы любите заниматься в свободное время?'
    }
  };

  if (topic && topicMessages[language] && topicMessages[language][topic]) {
    return topicMessages[language][topic];
  }

  return greetings[language.toLowerCase()] || greetings['english'];
}

// Генерация ответа AI с использованием Groq (бесплатный API)
async function generateAIResponse(userMessage, language, topic, conversationHistory, metadata = {}) {
  let response = '';
  let feedback = null;
  let corrections = [];
  let suggestions = [];

  // Инициализируем клиент Groq (бесплатный API)
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    logger.warn("GROQ_API_KEY не установлен, используем fallback ответы");
    // Fallback на простые ответы, если API ключ не установлен
    return generateFallbackResponse(userMessage, language, topic, conversationHistory, metadata);
  }

  const groq = new Groq({ apiKey: apiKey });

  // Получаем информацию о друге из metadata
  const friendName = metadata?.friendName || 'AI Friend';
  const personality = metadata?.personality || 'friendly and helpful';
  const friendId = metadata?.friendId || '';

  try {
    // Формируем системный промпт с учетом личности друга
    const systemPrompt = `You are ${friendName}, a friendly AI conversation partner for language learning practice. Your personality: ${personality}. 

Your role:
- Help the user practice ${language === 'english' ? 'English' : language === 'russian' ? 'Russian' : 'Kazakh'} conversation
- Be natural, engaging, and encouraging
- Ask follow-up questions to keep the conversation going
- Respond in ${language === 'english' ? 'English' : language === 'russian' ? 'Russian' : 'Kazakh'}
- Keep responses conversational and not too long (2-3 sentences)
- Show interest in what the user says and ask relevant questions

${topic ? `Current conversation topic: ${topic}` : ''}

Be yourself - ${personality}. Make the conversation feel natural and friendly.`;

    // Формируем историю сообщений для контекста
    const messages = conversationHistory.slice(-10).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content || msg.text || ''
    }));

    // Добавляем текущее сообщение пользователя
    messages.push({
      role: 'user',
      content: userMessage
    });

    // Вызываем Groq API (бесплатный)
    const groqResponse = await groq.chat.completions.create({
      model: 'llama-3.1-70b-versatile', // Бесплатная модель от Groq
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    // Извлекаем ответ
    response = groqResponse.choices[0]?.message?.content || '';

    // Простая проверка грамматики
    if (userMessage.length < 5) {
      feedback = language === 'english'
        ? "Your message is quite short. Try to give a more detailed answer!"
        : language === 'russian'
        ? "Ваше сообщение слишком короткое. Попробуйте составить более развернутый ответ."
        : "Сіздің хабарламаңыз өте қысқа. Толығырақ жауап беруге тырысыңыз!";
      suggestions.push(language === 'english'
        ? "Try adding more details to your answer."
        : language === 'russian'
        ? "Попробуйте добавить больше деталей к вашему ответу."
        : "Жауабыңызға көбірек мәліметтер қосып көріңіз.");
    }

    logger.info("Groq API response generated", {
      userMessage: userMessage.substring(0, 50),
      response: response.substring(0, 50),
      responseLength: response.length,
      friendId,
      language
    });

  } catch (error) {
    logger.error("Groq API error, using fallback", {
      error: error.message,
      userMessage: userMessage.substring(0, 50)
    });
    
    // В случае ошибки используем fallback
    return generateFallbackResponse(userMessage, language, topic, conversationHistory, metadata);
  }

  // Гарантируем, что ответ не пустой
  if (!response || response.trim() === '') {
    logger.warn("Empty response from Groq, using fallback");
    return generateFallbackResponse(userMessage, language, topic, conversationHistory, metadata);
  }

  return {
    text: response,
    feedback,
    corrections: [],
    suggestions
  };
}

// Fallback функция для случаев, когда API недоступен
function generateFallbackResponse(userMessage, language, topic, conversationHistory, metadata = {}) {
  const message = userMessage.toLowerCase();
  let response = '';
  let feedback = null;
  let corrections = [];
  let suggestions = [];

  // Получаем информацию о друге из metadata
  const friendName = metadata?.friendName || '';
  const personality = metadata?.personality || '';
  const friendId = metadata?.friendId || '';

  // Персонализированные ответы на основе личности друга
  const friendResponses = {
    'alex': {
      greetings: language === 'english' 
        ? "Hey! Great to hear from you! What's new in your world?"
        : "Привет! Рад тебя слышать! Что нового?",
      howAreYou: language === 'english'
        ? "I'm doing awesome! Just finished a workout. How about you? What's keeping you busy?"
        : "У меня все отлично! Только закончил тренировку. А у тебя? Чем занимаешься?",
      default: language === 'english'
        ? "That's really cool! Tell me more about it. I love hearing about new experiences!"
        : "Это действительно круто! Расскажи подробнее. Я обожаю слушать о новых впечатлениях!"
    },
    'sarah': {
      greetings: language === 'english'
        ? "Hi there! So happy to chat with you! What creative things have you been up to?"
        : "Привет! Очень рада пообщаться! Чем творческим ты занимаешься?",
      howAreYou: language === 'english'
        ? "I'm wonderful! Just finished a painting. How are you feeling today? Any inspiration?"
        : "У меня все прекрасно! Только закончила картину. Как ты себя чувствуешь? Есть вдохновение?",
      default: language === 'english'
        ? "That sounds fascinating! I'd love to hear more details. What inspired you?"
        : "Это звучит увлекательно! Хотелось бы услышать больше деталей. Что тебя вдохновило?"
    },
    'mike': {
      greetings: language === 'english'
        ? "Hey! Ready to chat? I'm always pumped for a good conversation!"
        : "Привет! Готов поболтать? Я всегда в восторге от хорошего разговора!",
      howAreYou: language === 'english'
        ? "I'm feeling great! Just got back from the gym. How's your energy today?"
        : "Чувствую себя отлично! Только вернулся из спортзала. Как твоя энергия сегодня?",
      default: language === 'english'
        ? "That's awesome! Keep it up! Want to share more about it?"
        : "Это потрясающе! Продолжай в том же духе! Хочешь рассказать больше?"
    },
    'emma': {
      greetings: language === 'english'
        ? "Hello! I'm so glad we can talk! What interesting things have you learned lately?"
        : "Привет! Я так рада, что мы можем поговорить! Что интересного ты узнал недавно?",
      howAreYou: language === 'english'
        ? "I'm excellent! Just finished reading a fascinating book. How's your day going?"
        : "У меня все отлично! Только закончила читать увлекательную книгу. Как проходит твой день?",
      default: language === 'english'
        ? "That's really interesting! I'd love to learn more. Can you elaborate?"
        : "Это действительно интересно! Хотелось бы узнать больше. Можешь рассказать подробнее?"
    },
    'david': {
      greetings: language === 'english'
        ? "Hey! Great to see you! Ready for some fun conversation?"
        : "Привет! Рад тебя видеть! Готов к веселому разговору?",
      howAreYou: language === 'english'
        ? "I'm fantastic! Just had an amazing meal. How are you doing? Anything fun happening?"
        : "У меня все замечательно! Только съел потрясающее блюдо. Как дела? Что-то интересное происходит?",
      default: language === 'english'
        ? "Haha, that's great! I love it! Tell me more, I'm all ears!"
        : "Ха-ха, это здорово! Мне нравится! Расскажи больше, я весь во внимании!"
    },
    'lisa': {
      greetings: language === 'english'
        ? "Hi! So excited to talk with you! Have you traveled anywhere interesting lately?"
        : "Привет! Так рада поговорить с тобой! Путешествовал куда-нибудь интересное недавно?",
      howAreYou: language === 'english'
        ? "I'm wonderful! Just learned about a new culture. How are you? Any adventures?"
        : "У меня все прекрасно! Только узнала о новой культуре. Как дела? Есть приключения?",
      default: language === 'english'
        ? "That's so interesting! I love learning about different perspectives. Can you share more?"
        : "Это так интересно! Я обожаю узнавать о разных точках зрения. Можешь поделиться больше?"
    }
  };

  // Выбираем ответы на основе друга
  const responses = friendResponses[friendId] || {
    greetings: language === 'english' 
      ? "Hello! I'm glad to talk with you. How can I help you practice today?"
      : "Привет! Рад поговорить с тобой. Чем могу помочь в практике сегодня?",
    howAreYou: language === 'english'
      ? "I'm doing great, thank you! How about you? What did you do today?"
      : "У меня все отлично, спасибо! А у тебя? Что ты делал сегодня?",
    default: language === 'english'
      ? "That's interesting! Can you tell me more about that?"
      : "Это интересно! Можешь рассказать об этом подробнее?"
  };

  // Анализируем историю разговора для контекста
  const userMessagesCount = conversationHistory.filter(m => m.role === 'user').length;
  const isFirstResponse = userMessagesCount === 1;
  
  // Простые ответы на основе ключевых слов
  if (message.includes('hello') || message.includes('hi') || message.includes('привет') || message.includes('сәлем')) {
    response = responses.greetings;
  } else if (message.includes('how are you') || message.includes('как дела') || message.includes('қалыңыз қалай')) {
    response = responses.howAreYou;
  } else if (message.includes('good') || message.includes('fine') || message.includes('хорошо') || message.includes('жақсы')) {
    // Ответ на вопрос "как дела"
    response = language === 'english'
      ? "That's great to hear! What have you been up to lately?"
      : language === 'russian'
      ? "Отлично! Чем ты занимался недавно?"
      : "Жақсы! Соңғы кезде не істедің?";
  } else if (message.includes('thank') || message.includes('thanks') || message.includes('спасибо') || message.includes('рахмет')) {
    response = language === 'english'
      ? "You're welcome! Is there anything else you'd like to talk about?"
      : language === 'russian'
      ? "Пожалуйста! Есть еще что-то, о чем хочешь поговорить?"
      : "Рақмет! Тағы да сөйлескің келе ме?";
  } else if (message.includes('yes') || message.includes('yeah') || message.includes('да') || message.includes('иә')) {
    response = language === 'english'
      ? "Awesome! Tell me more about it!"
      : language === 'russian'
      ? "Отлично! Расскажи подробнее!"
      : "Керемет! Толығырақ айт!";
  } else if (message.includes('no') || message.includes('нет') || message.includes('жоқ')) {
    response = language === 'english'
      ? "No problem! What would you like to talk about instead?"
      : language === 'russian'
      ? "Ничего страшного! О чем бы ты хотел поговорить?"
      : "Ешқандай мәселе жоқ! Не туралы сөйлесуді қалайсың?";
  } else if (message.includes('travel') || message.includes('trip') || message.includes('путешествие') || message.includes('саяхат')) {
    response = language === 'english'
      ? "I love traveling! Where have you been? What's your favorite place?"
      : language === 'russian'
      ? "Я обожаю путешествия! Где ты был? Какое твое любимое место?"
      : "Мен саяхаттауды жақсы көремін! Қайда болдың? Сенің сүйікті жерің қайда?";
  } else if (message.includes('food') || message.includes('eat') || message.includes('еда') || message.includes('тағам')) {
    response = language === 'english'
      ? "Food is amazing! What's your favorite cuisine? Do you like cooking?"
      : language === 'russian'
      ? "Еда - это прекрасно! Какая твоя любимая кухня? Ты любишь готовить?"
      : "Тағам керемет! Сенің сүйікті ас мәдениетің қандай? Аспаздықты жақсы көресің бе?";
  } else if (message.includes('hobby') || message.includes('hobbies') || message.includes('хобби') || message.includes('қызығушылық')) {
    response = language === 'english'
      ? "Hobbies are great! What do you enjoy doing in your free time?"
      : language === 'russian'
      ? "Хобби - это здорово! Чем ты любишь заниматься в свободное время?"
      : "Қызығушылықтар керемет! Бос уақытыңда не істейсің?";
  } else if (message.includes('work') || message.includes('job') || message.includes('работа') || message.includes('жұмыс')) {
    response = language === 'english'
      ? "Work is important! What do you do? Do you enjoy it?"
      : language === 'russian'
      ? "Работа важна! Чем ты занимаешься? Тебе нравится?"
      : "Жұмыс маңызды! Не істейсің? Ұнайды ма?";
  } else if (message.includes('sport') || message.includes('exercise') || message.includes('спорт') || message.includes('дене шынықтыру')) {
    response = language === 'english'
      ? "Sports are awesome! What sports do you like? Do you play any?"
      : language === 'russian'
      ? "Спорт - это отлично! Какие виды спорта тебе нравятся? Ты занимаешься спортом?"
      : "Спорт керемет! Қандай спорт түрлерін ұнатасың? Спортпен айналысасың ба?";
  } else if (message.includes('poetry') || message.includes('poem') || message.includes('стих') || message.includes('поэзия') || message.includes('өлең')) {
    // Специальные ответы для Sarah (творческая личность)
    if (friendId === 'sarah') {
      response = language === 'english'
        ? "Oh, I absolutely adore poetry! It's such a beautiful form of expression. Do you write poems yourself? What kind of poetry moves you the most?"
        : language === 'russian'
        ? "О, я просто обожаю поэзию! Это такая прекрасная форма выражения. Ты пишешь стихи сам? Какая поэзия тебя больше всего трогает?"
        : "О, мен өлеңді өте жақсы көремін! Бұл әдемі білдіру түрі. Сен өзің өлең жазасың ба? Қандай өлең сені ең көп қозғайды?";
    } else {
      response = language === 'english'
        ? "Poetry is beautiful! Do you write poems? Who's your favorite poet?"
        : language === 'russian'
        ? "Поэзия прекрасна! Ты пишешь стихи? Кто твой любимый поэт?"
        : "Өлең әдемі! Сен өлең жазасың ба? Сенің сүйікті ақының кім?";
    }
  } else if (message.includes('art') || message.includes('painting') || message.includes('drawing') || message.includes('искусство') || message.includes('живопись') || message.includes('өнер')) {
    response = language === 'english'
      ? "Art is wonderful! What kind of art do you like? Do you create art yourself?"
      : language === 'russian'
      ? "Искусство прекрасно! Какое искусство тебе нравится? Ты сам создаешь искусство?"
      : "Өнер керемет! Қандай өнерді ұнатасың? Сен өзің өнер жасайсың ба?";
  } else if (message.includes('music') || message.includes('song') || message.includes('музыка') || message.includes('песня') || message.includes('ән')) {
    response = language === 'english'
      ? "Music is amazing! What genres do you enjoy? Do you play any instruments?"
      : language === 'russian'
      ? "Музыка потрясающая! Какие жанры тебе нравятся? Ты играешь на инструментах?"
      : "Ән керемет! Қандай жанрларды ұнатасың? Аспапта ойнайсың ба?";
  } else if (message.includes('love') || message.includes('like') || message.includes('люблю') || message.includes('нравится') || message.includes('ұнатамын') || message.includes('жақсы көремін')) {
    // Общий ответ на "I love..." или "I like..."
    const lovedThing = message.replace(/^(i|я|мен)\s+(love|like|люблю|нравится|ұнатамын|жақсы көремін)\s+/i, '').trim();
    // Специальные ответы для разных друзей
    if (friendId === 'sarah' && (lovedThing.includes('art') || lovedThing.includes('poetry') || lovedThing.includes('music') || lovedThing.includes('creative'))) {
      response = language === 'english'
        ? `That's wonderful! I love that you're passionate about ${lovedThing || 'creativity'}! What draws you to it? Have you created anything recently?`
        : language === 'russian'
        ? `Замечательно! Мне нравится, что ты увлечен ${lovedThing || 'творчеством'}! Что тебя к этому привлекает? Ты создавал что-то недавно?`
        : `Керемет! Менің ойымша, сіз ${lovedThing || 'шығармашылыққа'} құмар екеніңіз! Сізді не тартады? Соңғы кезде бірдеңе жасадыңыз ба?`;
    } else {
      response = language === 'english'
        ? `That's wonderful that you love ${lovedThing || 'that'}! Tell me more about why you like it. What makes it special to you?`
        : language === 'russian'
        ? `Замечательно, что ты любишь ${lovedThing || 'это'}! Расскажи больше, почему тебе это нравится. Что делает это особенным для тебя?`
        : `${lovedThing || 'Оны'} жақсы көруің керемет! Неге ұнататының туралы көбірек айт. Ол сен үшін неге ерекше?`;
    }
  } else {
    // Общий ответ с учетом личности и контекста
    if (isFirstResponse) {
      // После первого ответа задаем вопрос для продолжения разговора
      const followUpQuestions = {
        'alex': language === 'english'
          ? "That's interesting! What else is happening in your life? Any exciting plans?"
          : "Это интересно! Что еще происходит в твоей жизни? Есть какие-то интересные планы?",
        'sarah': language === 'english'
          ? "I love that! What inspires you? Have you done anything creative recently? Do you write or create art?"
          : language === 'russian'
          ? "Мне это нравится! Что тебя вдохновляет? Делал ли ты что-то творческое недавно? Ты пишешь или создаешь искусство?"
          : "Менің ойымша, бұл керемет! Сені не шабыттандырады? Соңғы кезде шығармашылықпен айналыстың ба? Сен жазасың ба немесе өнер жасайсың ба?",
        'mike': language === 'english'
          ? "Sounds great! How do you stay active? What's your favorite way to exercise?"
          : "Звучит отлично! Как ты остаешься активным? Какой твой любимый способ тренироваться?",
        'emma': language === 'english'
          ? "That's fascinating! What have you learned recently? Any interesting books or topics?"
          : "Это увлекательно! Что ты узнал недавно? Есть интересные книги или темы?",
        'david': language === 'english'
          ? "Haha, I love it! What's the funniest thing that happened to you recently?"
          : "Ха-ха, мне нравится! Что самое смешное случилось с тобой недавно?",
        'lisa': language === 'english'
          ? "That's wonderful! Have you traveled anywhere interesting? What cultures fascinate you?"
          : "Это замечательно! Путешествовал ли ты куда-нибудь интересное? Какие культуры тебя увлекают?"
      };
      
      response = followUpQuestions[friendId] || responses.default;
    } else {
      // Продолжаем разговор, задавая уточняющие вопросы
      const continuationQuestions = {
        'alex': language === 'english'
          ? "That's really cool! Can you tell me more details? I'm curious!"
          : "Это действительно круто! Можешь рассказать больше деталей? Мне интересно!",
        'sarah': language === 'english'
          ? "That sounds amazing! How did that make you feel? What was the best part?"
          : "Это звучит потрясающе! Как ты себя чувствовал? Что было самым лучшим?",
        'mike': language === 'english'
          ? "Awesome! How did you get into that? What keeps you motivated?"
          : "Потрясающе! Как ты этим увлекся? Что тебя мотивирует?",
        'emma': language === 'english'
          ? "Very interesting! What did you learn from that experience? Any insights?"
          : "Очень интересно! Чему ты научился из этого опыта? Есть какие-то выводы?",
        'david': language === 'english'
          ? "Haha, that's hilarious! What happened next? Tell me more!"
          : "Ха-ха, это смешно! Что было дальше? Расскажи больше!",
        'lisa': language === 'english'
          ? "That's wonderful! How did you discover that? What did you find most interesting?"
          : "Это замечательно! Как ты это обнаружил? Что показалось самым интересным?"
      };
      
      response = continuationQuestions[friendId] || responses.default;
    }
  }

  // Гарантируем, что всегда есть ответ
  if (!response || response.trim() === '') {
    // Fallback ответ с учетом личности друга
    const fallbackResponses = {
      'alex': language === 'english'
        ? "That's really interesting! Can you tell me more about that? I'm curious to learn more!"
        : language === 'russian'
        ? "Это действительно интересно! Можешь рассказать больше? Мне любопытно узнать больше!"
        : "Бұл шынымен қызықты! Толығырақ айта аласың ба? Мен көбірек білгім келеді!",
      'sarah': language === 'english'
        ? "That sounds fascinating! I'd love to hear more about your thoughts on that. What draws you to it?"
        : language === 'russian'
        ? "Это звучит увлекательно! Мне бы хотелось услышать больше о твоих мыслях об этом. Что тебя к этому привлекает?"
        : "Бұл керемет естіледі! Мен сіздің ойларыңыз туралы көбірек естігім келеді. Сізді не тартады?",
      'mike': language === 'english'
        ? "That's awesome! Tell me more! What keeps you motivated about that?"
        : language === 'russian'
        ? "Это потрясающе! Расскажи больше! Что тебя мотивирует в этом?"
        : "Бұл керемет! Толығырақ айт! Бұл сізді неге мотивациялайды?",
      'emma': language === 'english'
        ? "Very interesting! I'd love to learn more. Can you share more details about that?"
        : language === 'russian'
        ? "Очень интересно! Мне бы хотелось узнать больше. Можешь поделиться подробностями?"
        : "Өте қызықты! Мен көбірек білгім келеді. Толығырақ бөлісе аласың ба?",
      'david': language === 'english'
        ? "Haha, that's great! Tell me more! What's the funniest or most interesting part?"
        : language === 'russian'
        ? "Ха-ха, это здорово! Расскажи больше! Какая самая смешная или интересная часть?"
        : "Ха-ха, бұл керемет! Толығырақ айт! Ең күлкілі немесе қызықты бөлігі қандай?",
      'lisa': language === 'english'
        ? "That's wonderful! I'm fascinated by that. Can you tell me more about how you discovered it?"
        : language === 'russian'
        ? "Это замечательно! Меня это увлекает. Можешь рассказать больше о том, как ты это обнаружил?"
        : "Бұл керемет! Мені бұл қызықтырады. Сіз оны қалай тапқаныңыз туралы көбірек айта аласыз ба?"
    };
    
    response = fallbackResponses[friendId] || (language === 'english'
      ? "That's interesting! Tell me more about that. I'd love to hear your thoughts!"
      : language === 'russian'
      ? "Это интересно! Расскажи подробнее. Мне бы хотелось услышать твои мысли!"
      : "Бұл қызықты! Толығырақ айт. Менің ойымша, сіздің ойларыңызды естуге қуаныштымын!");
  }

  // Простая проверка грамматики (для демонстрации)
  if (userMessage.length < 5) {
    feedback = language === 'english'
      ? "Your message is quite short. Try to give a more detailed answer!"
      : "Ваше сообщение слишком короткое. Попробуйте составить более развернутый ответ.";
    suggestions.push(language === 'english'
      ? "Try adding more details to your answer."
      : "Попробуйте добавить больше деталей к вашему ответу.");
  }

  // Логируем для отладки
  logger.info("AI Response generated", {
    userMessage: userMessage.substring(0, 50),
    response: response.substring(0, 50),
    responseLength: response.length,
    friendId,
    userMessagesCount,
    isFirstResponse,
    language
  });
  
  // Финальная проверка - гарантируем, что ответ не пустой
  if (!response || response.trim() === '') {
    logger.error("Empty response generated! Using fallback.", {
      userMessage: userMessage.substring(0, 50),
      friendId,
      language
    });
    response = language === 'english'
      ? "I'm here! Let's continue our conversation. What would you like to talk about?"
      : language === 'russian'
      ? "Я здесь! Давай продолжим разговор. О чем хочешь поговорить?"
      : "Мен мұндамын! Әңгімені жалғастырайық. Не туралы сөйлесуді қалайсың?";
  }

  return {
    text: response,
    feedback,
    corrections,
    suggestions
  };
}

// Оценка разговора
function evaluateConversation(messages, language) {
  const userMessages = messages.filter(m => m.role === 'user');
  const totalLength = userMessages.reduce((sum, m) => sum + (m.content?.length || 0), 0);
  const averageLength = userMessages.length > 0 ? totalLength / userMessages.length : 0;

  // Простая оценка на основе количества сообщений и их длины
  let score = Math.min(100, userMessages.length * 10 + Math.min(50, averageLength / 2));

  let feedback = '';
  if (score >= 80) {
    feedback = "Отличная работа! Вы активно участвовали в разговоре.";
  } else if (score >= 60) {
    feedback = "Хорошая работа! Попробуйте говорить больше и подробнее.";
  } else {
    feedback = "Неплохо! В следующий раз попробуйте давать более развернутые ответы.";
  }

  return {
    score: Math.round(score),
    feedback,
    averageLength: Math.round(averageLength)
  };
}

