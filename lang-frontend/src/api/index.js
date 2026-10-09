// API URL-ді ортаға байланысты анықтау
let API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// https://localhost-ты http://localhost-қа түзету (жергілікті сервер SSL қолданбайды)
if (API_URL.startsWith('https://localhost')) {
  API_URL = API_URL.replace('https://', 'http://');
}

// Жөндеу: API URL-ді шығару
console.log('[API Config] API_URL:', API_URL);
console.log('[API Config] Environment variables:', import.meta.env);

import { getCached, setCache } from "../utils/cache";

// Retry және кэшпен сұраулар үшін негізгі функция
async function apiRequest(endpoint, method = "GET", body = null, token = null, options = {}) {
  const { useCache = false, cacheKey = null, retries = 0, retryDelay = 1000, requestName = null } = options;

  // GET сұраулары үшін ғана кэшті тексеру
  if (method === "GET" && useCache && cacheKey) {
    const cached = getCached(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  const headers = { "Content-Type": "application/json" };
  const userToken = token || localStorage.getItem("token");
  if (userToken) headers["Authorization"] = `Bearer ${userToken}`;
  
  // Логирование және DevTools үшін сұрау атауы (тақырып үшін ағылшын атауларын қолданамыз)
  const requestLabel = requestName || `${method} ${endpoint}`;
  
  // Вспомогательная функция для капитализации первой буквы
  const capitalize = (str) => {
    if (!str) return 'Request';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Функция для извлечения понятного имени из endpoint
  const extractNameFromEndpoint = (endpoint, method) => {
    const parts = endpoint.split('/').filter(Boolean);
    
    // Убираем числовые ID из частей
    const cleanParts = parts.filter(part => !/^\d+$/.test(part));
    
    // Маппинг путей к понятным названиям
    const endpointMap = {
      'auth': {
        'register': 'Register',
        'login': 'Login',
        'me': 'GetUser',
        'verify-email': 'VerifyEmail',
        'forgot-password': 'ForgotPassword',
        'reset-password': 'ResetPassword',
      },
      'courses': {
        'default': 'GetCourses',
        'id': 'GetCourse',
      },
      'lessons': {
        'course': 'GetLessonsByCourse',
        'id': 'GetLesson',
        'default': 'GetLessons',
      },
      'progress': {
        'user': 'GetUserProgress',
        'course': 'GetCourseProgress',
        'default': method === 'POST' ? 'UpdateProgress' : 'GetProgress',
      },
      'achievements': {
        'add-xp': 'AddXP',
        'complete-lesson': 'CompleteLesson',
        'default': 'GetAchievements',
      },
      'leaderboard': {
        'default': 'GetLeaderboard',
      },
      'notifications': {
        'read': 'MarkNotificationRead',
        'default': method === 'POST' ? 'CreateNotification' : 'GetNotifications',
      },
    };

    if (cleanParts.length >= 1) {
      const resource = cleanParts[0];
      const action = cleanParts[1];
      
      if (endpointMap[resource]) {
        if (action && endpointMap[resource][action]) {
          return endpointMap[resource][action];
        }
        if (cleanParts.length === 1 && endpointMap[resource]['default']) {
          return endpointMap[resource]['default'];
        }
        if (cleanParts.length === 2 && /^\d+$/.test(parts[1]) && endpointMap[resource]['id']) {
          return endpointMap[resource]['id'];
        }
        return endpointMap[resource]['default'] || capitalize(resource);
      }
    }
    
    // Fallback: используем метод + первый сегмент пути
    const resource = cleanParts[0] || 'api';
    const action = method === 'GET' ? 'Get' : method === 'POST' ? 'Create' : method === 'PUT' ? 'Update' : method === 'DELETE' ? 'Delete' : '';
    return action + capitalize(resource);
  };
  
  // URL үшін қысқа ағылшын атауы құру (бір сөз)
  const getEnglishName = (name) => {
    if (!name) {
      // Если имя не передано, извлекаем из endpoint
      return extractNameFromEndpoint(endpoint, method);
    }
    
    // Сәйкестендіру үшін атаудан ID-ны алып тастау
    const cleanName = name.replace(/#\d+/g, '').trim();
    
    const nameMap = {
      "Пайдаланушыны тіркеу": "Register",
      "Жүйеге кіру": "Login",
      "Пайдаланушы деректерін алу": "GetUser",
      "Email растау": "VerifyEmail",
      "Барлық курстарды алу": "GetCourses",
      "Курсты алу": "GetCourse",
      "Курс сабақтарын алу": "GetLessons",
      "Сабақты алу": "GetLesson",
      "Пайдаланушы прогрессін алу": "GetUserProgress",
      "Курс прогрессін алу": "GetCourseProgress",
      "Сабақ прогрессін жаңарту": "UpdateProgress",
      "Пайдаланушы жетістіктерін алу": "GetAchievements",
      "Сабақты аяқтау": "CompleteLesson",
      "Көшбасшылар кестесін алу": "GetLeaderboard",
      "Хабарландыруларды алу": "GetNotifications",
      "Хабарландыруды белгілеу": "MarkNotificationRead",
      "Хабарландыру құру": "CreateNotification",
    };
    
    // Специальная обработка для похожих названий
    if (name.includes("forgot") || name.includes("қалпына келтіру") && endpoint.includes("forgot")) {
      return "ForgotPassword";
    }
    if (name.includes("reset") || name.includes("қалпына келтіру") && endpoint.includes("reset")) {
      return "ResetPassword";
    }
    if (name.includes("XP") || name.includes("Қосу")) {
      return "AddXP";
    }
    
    // Сәйкестікті іздеу (алдымен тазартылған атау бойынша, содан кейін түпнұсқа бойынша)
    for (const [key, value] of Object.entries(nameMap)) {
      if (cleanName.includes(key) || name.includes(key)) {
        return value;
      }
    }
    
    // Если не найдено в карте, пытаемся извлечь из endpoint
    return extractNameFromEndpoint(endpoint, method);
  };

  // Добавляем имя запроса в URL как query параметр для отображения в DevTools Name колонке
  // Используем _name параметр для всех методов (бэкенд обычно игнорирует неизвестные query параметры)
  let requestUrl = `${API_URL}${endpoint}`;
  // Всегда генерируем понятное имя, даже если requestName не передан
  const englishName = getEnglishName(requestName || `${method} ${endpoint}`);
  // Добавляем query параметр _name для видимости в DevTools
  // Бэкенд должен игнорировать этот параметр, если он его не использует
  const separator = endpoint.includes("?") ? "&" : "?";
  // Имена короткие (одно слово), но используем encodeURIComponent для безопасности
  requestUrl = `${requestUrl}${separator}_name=${encodeURIComponent(englishName)}`;

  // Функция для маскировки паролей в теле запроса
  const maskPassword = (data) => {
    if (!data || typeof data !== 'object') return data;
    const masked = { ...data };
    // Маскируем поля с паролями
    if (masked.password) masked.password = '••••••••';
    if (masked.currentPassword) masked.currentPassword = '••••••••';
    if (masked.newPassword) masked.newPassword = '••••••••';
    if (masked.confirmPassword) masked.confirmPassword = '••••••••';
    return masked;
  };

  let lastError;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      let res;
      try {
        // Создаем тело запроса с оригинальными данными (пароль отправляется на сервер)
        const requestBody = body ? JSON.stringify(body) : undefined;
        
        // Создаем Request объект для лучшей видимости в DevTools
        // Используем оригинальное тело для отправки, но маскируем в логах
        const request = new Request(requestUrl, {
          method,
          headers,
          body: requestBody,
        });
        
        // Добавляем имя запроса через свойство для логирования
        // (не добавляем в заголовки, т.к. HTTP заголовки должны быть ASCII)
        if (requestName) {
          Object.defineProperty(request, '_requestName', {
            value: requestLabel,
            writable: false,
            enumerable: false,
            configurable: true
          });
        }
        
        res = await fetch(request);
      } catch (fetchError) {
        // Ошибка сети (сервер недоступен, CORS и т.д.)
        if (import.meta.env.DEV) {
          console.error(`[API Network Error] ${method} ${endpoint}:`, fetchError);
        }
        throw new Error(`Серверге қосылу мүмкін болмады: ${fetchError.message}`);
      }

      const data = await res.json().catch(() => ({}));
      
      // Логируем запросы в режиме разработки (маскируем пароли)
      if (import.meta.env.DEV) {
        const maskedBody = body ? maskPassword(body) : null;
        console.log(`[API] ${requestLabel}`, { 
          method, 
          endpoint, 
          status: res.status, 
          ok: res.ok,
          url: `${API_URL}${endpoint}`,
          ...(maskedBody && { body: maskedBody })
        });
      }
      
      if (!res.ok) {
        // Обработка 401 - неавторизован
        if (res.status === 401) {
          localStorage.removeItem("token");
          throw new Error("Сессия мерзімі өтті. Қайта кіріңіз.");
        }
        // Обработка 429 - слишком много запросов
        if (res.status === 429) {
          const retryAfter = parseInt(res.headers.get('Retry-After') || '15');
          // Для 429 ждем дольше перед повтором
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            lastError = new Error(`Тым көп сұраулар. ${retryAfter} секундтан кейін қайталаңыз.`);
            continue;
          }
          throw new Error(`Тым көп сұраулар. ${retryAfter} секундтан кейін қайталаңыз.`);
        }
        
        // Для других ошибок - пробуем повторить, если есть попытки
        if (attempt < retries && res.status >= 500) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
          lastError = new Error(data.message || `Қате ${res.status}: ${data.error || "Сұрау қатесі"}`);
          continue;
        }
        
        throw new Error(data.message || `Қате ${res.status}: ${data.error || "Сұрау қатесі"}`);
      }
      
      // Сохраняем в кэш для успешных GET запросов
      if (method === "GET" && useCache && cacheKey) {
        setCache(cacheKey, data);
      }
      
      return data;
    } catch (error) {
      lastError = error;
      // Логируем ошибки в режиме разработки
      if (import.meta.env.DEV) {
        console.error(`[API Error] ${method} ${endpoint} (attempt ${attempt + 1}/${retries + 1}):`, error);
      }
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }
  }
  
  // Логируем финальную ошибку перед выбрасыванием
  if (import.meta.env.DEV && lastError) {
    console.error(`[API Final Error] ${method} ${endpoint}:`, lastError);
  }
  
  throw lastError;
}

// ==================== АУТЕНТИФИКАЦИЯ ====================
export const auth = {
  // Тіркелу
  register: async (userData) => {
    return apiRequest("/auth/register", "POST", userData, null, { requestName: "Пайдаланушыны тіркеу" });
  },

  // Кіру
  login: async (email, password) => {
    return apiRequest("/auth/login", "POST", { email, password }, null, { requestName: "Жүйеге кіру" });
  },

  // Ағымдағы пайдаланушы туралы ақпарат алу
  getMe: async () => {
    return apiRequest("/auth/me", "GET", null, null, { requestName: "Пайдаланушы деректерін алу" });
  },

  // Email растау
  verifyEmail: async (token) => {
    return apiRequest(`/auth/verify-email/${token}`, "GET", null, null, { requestName: "Email растау" });
  },

  // Құпия сөзді қалпына келтіру
  forgotPassword: async (email) => {
    return apiRequest("/auth/forgot-password", "POST", { email }, null, { requestName: "Құпия сөзді қалпына келтіру" });
  },

  // Құпия сөзді қалпына келтіру
  resetPassword: async (token, newPassword) => {
    return apiRequest(`/auth/reset-password/${token}`, "POST", { newPassword }, null, { requestName: "Құпия сөзді қалпына келтіру" });
  },

  // Құпия сөзді өзгерту (авторизованным пользователем)
  changePassword: async (currentPassword, newPassword) => {
    const token = localStorage.getItem("token");
    return apiRequest("/auth/change-password", "POST", { currentPassword, newPassword }, token, { requestName: "Құпия сөзді өзгерту" });
  },

  // Параметрлерді алу
  getSettings: async () => {
    const token = localStorage.getItem("token");
    return apiRequest("/auth/settings", "GET", null, token, { requestName: "Параметрлерді алу" });
  },

  // Параметрлерді сақтау
  saveSettings: async (settings) => {
    const token = localStorage.getItem("token");
    return apiRequest("/auth/settings", "PUT", { settings }, token, { requestName: "Параметрлерді сақтау" });
  },
};

// ==================== КУРСТАР ====================
export const courses = {
  // Барлық курстарды алу (кэшпен)
  getAll: async () => {
    return apiRequest("/courses", "GET", null, null, {
      useCache: true,
      cacheKey: "courses:all",
      retries: 2,
      requestName: "Барлық курстарды алу",
    });
  },

  // ID бойынша курс алу
  getById: async (id) => {
    return apiRequest(`/courses/${id}`, "GET", null, null, { requestName: `Курс #${id} алу` });
  },
};

// ==================== САБАҚТАР ====================
export const lessons = {
  // Курстың барлық сабақтарын алу
  getByCourse: async (courseId) => {
    return apiRequest(`/lessons/course/${courseId}`, "GET", null, null, { requestName: `Курс #${courseId} сабақтарын алу` });
  },

  // ID бойынша сабақ алу
  getById: async (id) => {
    return apiRequest(`/lessons/${id}`, "GET", null, null, { requestName: `Сабақ #${id} алу` });
  },
};

// ==================== ПРОГРЕСС ====================
export const progress = {
  // Пайдаланушының барлық курс бойынша прогрессін алу
  getByUser: async (userId) => {
    return apiRequest(`/progress/user/${userId}`, "GET", null, null, { requestName: `Пайдаланушы #${userId} прогрессін алу` });
  },

  // Белгілі бір курс бойынша прогресс алу
  getByCourse: async (userId, courseId) => {
    return apiRequest(`/progress/user/${userId}/course/${courseId}`, "GET", null, null, { requestName: `Курс #${courseId} прогрессін алу` });
  },

  // Прогресс қосу немесе жаңарту
  // user_id токеннен алынады, берудің қажеті жоқ
  addProgress: async (progressData) => {
    // user_id-ны алып тастаймыз, егер бар болса (енді токеннен алынады)
    // eslint-disable-next-line no-unused-vars
    const { user_id, ...data } = progressData;
    return apiRequest("/progress", "POST", data, null, { requestName: "Сабақ прогрессін жаңарту" });
  },
};

// ==================== ЖЕТІСТІКТЕР ====================
export const achievements = {
  // Пайдаланушы жетістіктерін алу
  getByUser: async (userId) => {
    return apiRequest(`/achievements/${userId}`, "GET", null, null, { requestName: `Пайдаланушы #${userId} жетістіктерін алу` });
  },

  // XP қосу
  addXP: async (userId, xpToAdd) => {
    return apiRequest("/achievements/add-xp", "POST", { user_id: userId, xp_to_add: xpToAdd }, null, { requestName: `${xpToAdd} XP қосу` });
  },

  // Сабақты аяқтау (аяқталған сабақтар санын және XP-ны арттырады)
  completeLesson: async (userId) => {
    return apiRequest("/achievements/complete-lesson", "POST", { user_id: userId }, null, { requestName: "Сабақты аяқтау" });
  },
};

// ==================== КӨШБАСШЫЛАР КЕСТЕСІ ====================
export const leaderboard = {
  // Көшбасшылар кестесін алу
  getAll: async () => {
    return apiRequest("/leaderboard", "GET", null, null, { requestName: "Көшбасшылар кестесін алу" });
  },
};

// ==================== ХАБАРЛАНДЫРУЛАР ====================
export const notifications = {
  // Ағымдағы пайдаланушының барлық хабарландыруларын алу
  getAll: async () => {
    return apiRequest("/notifications", "GET", null, null, { requestName: "Хабарландыруларды алу" });
  },

  // Хабарландыруды оқылған деп белгілеу
  markAsRead: async (notificationId) => {
    return apiRequest(`/notifications/${notificationId}/read`, "PUT", null, null, { requestName: `Хабарландыру #${notificationId} оқылған деп белгілеу` });
  },

  // Хабарландыру құру (әдетте әкімші тарапынан пайдаланылады)
  create: async (notificationData) => {
    return apiRequest("/notifications", "POST", notificationData, null, { requestName: "Хабарландыру құру" });
  },
};

// ==================== ОБРАТНАЯ СВЯЗЬ ====================
export const feedback = {
  // Отправить обратную связь
  submit: async (feedbackData) => {
    const token = localStorage.getItem("token");
    return apiRequest("/feedback", "POST", feedbackData, token, { 
      requestName: "Кері байланыс жіберу" 
    });
  },
  // Для обратной совместимости
  send: async (feedbackData) => {
    return feedback.submit(feedbackData);
  },
};

// ==================== ОТЗЫВЫ КУРСОВ ====================
export const reviews = {
  // Получить все отзывы курса
  getByCourse: async (courseId) => {
    const reviews = JSON.parse(localStorage.getItem("courseReviews") || "[]");
    return reviews.filter(r => r.course_id === parseInt(courseId));
  },

  // Создать отзыв
  create: async (reviewData) => {
    const reviews = JSON.parse(localStorage.getItem("courseReviews") || "[]");
    const newReview = {
      id: Date.now(),
      ...reviewData,
      createdAt: new Date().toISOString(),
    };
    reviews.push(newReview);
    localStorage.setItem("courseReviews", JSON.stringify(reviews));
    return { message: "Пікір сәтті қалдырылды!", data: newReview };
  },
};

// ==================== ЗАМЕТКИ ====================
export const notes = {
  // Получить все заметки пользователя
  getAll: async (userId) => {
    const allNotes = JSON.parse(localStorage.getItem("userNotes") || "[]");
    return allNotes.filter(n => n.user_id === parseInt(userId));
  },

  // Получить заметки по уроку
  getByLesson: async (userId, lessonId) => {
    const allNotes = JSON.parse(localStorage.getItem("userNotes") || "[]");
    return allNotes.filter(
      n => n.user_id === parseInt(userId) && n.lesson_id === parseInt(lessonId)
    );
  },

  // Создать заметку
  create: async (noteData) => {
    const allNotes = JSON.parse(localStorage.getItem("userNotes") || "[]");
    const newNote = {
      id: Date.now(),
      ...noteData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    allNotes.push(newNote);
    localStorage.setItem("userNotes", JSON.stringify(allNotes));
    return { message: "Жаңалық сәтті құрылды!", data: newNote };
  },

  // Обновить заметку
  update: async (noteId, noteData) => {
    const allNotes = JSON.parse(localStorage.getItem("userNotes") || "[]");
    const index = allNotes.findIndex(n => n.id === parseInt(noteId));
    if (index !== -1) {
      allNotes[index] = {
        ...allNotes[index],
        ...noteData,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem("userNotes", JSON.stringify(allNotes));
      return { message: "Жаңалық сәтті жаңартылды!", data: allNotes[index] };
    }
    throw new Error("Жаңалық табылмады");
  },

  // Удалить заметку
  delete: async (noteId) => {
    const allNotes = JSON.parse(localStorage.getItem("userNotes") || "[]");
    const filteredNotes = allNotes.filter(n => n.id !== parseInt(noteId));
    localStorage.setItem("userNotes", JSON.stringify(filteredNotes));
    return { message: "Жаңалық сәтті жойылды!" };
  },
};

// ==================== ТЕСТЫ ====================
export const tests = {
  // Получить все тесты по курсу
  getByCourse: async (courseId) => {
    return apiRequest(`/tests/course/${courseId}`, "GET", null, null, { 
      requestName: `Курс #${courseId} тестерін алу` 
    });
  },

  // Начать тест (получить вопросы)
  start: async (testId) => {
    return apiRequest(`/tests/${testId}/start`, "GET", null, null, { 
      requestName: `Тест #${testId} бастау` 
    });
  },

  // Отправить ответы на тест
  submit: async (testId, responses, timeTaken) => {
    return apiRequest(`/tests/${testId}/submit`, "POST", { responses, time_taken: timeTaken }, null, { 
      requestName: `Тест #${testId} жіберу` 
    });
  },

  // Получить результаты попытки
  getAttempt: async (attemptId) => {
    return apiRequest(`/tests/attempts/${attemptId}`, "GET", null, null, { 
      requestName: `Попытка #${attemptId} нәтижелерін алу` 
    });
  },

  // Получить все попытки пользователя по тесту
  getAttempts: async (testId) => {
    return apiRequest(`/tests/${testId}/attempts`, "GET", null, null, { 
      requestName: `Тест #${testId} попыткаларын алу` 
    });
  },
};

// ==================== СЕРТИФИКАТЫ ====================
export const certificates = {
  // Получить все сертификаты пользователя
  getMy: async () => {
    return apiRequest("/certificates/my", "GET", null, null, { 
      requestName: "Менің сертификаттарым" 
    });
  },

  // Получить конкретный сертификат
  getById: async (certificateId) => {
    return apiRequest(`/certificates/${certificateId}`, "GET", null, null, { 
      requestName: `Сертификат #${certificateId} алу` 
    });
  },

  // Проверить сертификат по номеру (публичный)
  verify: async (certificateNumber) => {
    return apiRequest(`/certificates/verify/${certificateNumber}`, "GET", null, null, { 
      requestName: `Сертификат тексеру` 
    });
  },

  // Скачать сертификат в формате PDF
  download: async (certificateId) => {
    const token = localStorage.getItem("token");
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    
    const response = await fetch(`${API_URL}/certificates/${certificateId}/download`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "PDF жүктеу қатесі");
    }

    return response.blob();
  },
};

// ==================== AI-РЕПЕТИТОР ====================
export const aiTutor = {
  // Анализ прогресса пользователя
  analyzeProgress: async () => {
    return apiRequest("/ai-tutor/analyze", "GET", null, null, {
      requestName: "AI-репетитор: анализ прогресса"
    });
  },

  // Сохранение ошибки пользователя
  logError: async (errorData) => {
    return apiRequest("/ai-tutor/errors", "POST", errorData, null, {
      requestName: "AI-репетитор: сохранение ошибки"
    });
  },

  // Получение рекомендаций
  getRecommendations: async () => {
    return apiRequest("/ai-tutor/recommendations", "GET", null, null, {
      requestName: "AI-репетитор: рекомендации"
    });
  },
};

// ==================== AI-РАЗГОВОРНАЯ ПРАКТИКА ====================
export const aiConversation = {
  // Начать новую разговорную практику
  start: async (conversationData) => {
    return apiRequest("/ai-conversation/start", "POST", conversationData, null, {
      requestName: "AI-разговор: начать"
    });
  },

  // Отправить сообщение
  sendMessage: async (conversationId, message, audioData = null) => {
    return apiRequest(`/ai-conversation/${conversationId}/message`, "POST", {
      message,
      audioData
    }, null, {
      requestName: "AI-разговор: отправить сообщение"
    });
  },

  // Завершить разговор
  end: async (conversationId) => {
    return apiRequest(`/ai-conversation/${conversationId}/end`, "POST", null, null, {
      requestName: "AI-разговор: завершить"
    });
  },

  // Получить историю разговоров
  getHistory: async (limit = 10) => {
    return apiRequest(`/ai-conversation/history?limit=${limit}`, "GET", null, null, {
      requestName: "AI-разговор: история"
    });
  },
};

// Экспорт базовой функции для обратной совместимости
export { apiRequest };
