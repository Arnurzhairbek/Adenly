# 📍 Местоположение принципов ООП в проекте

Данный документ указывает точные файлы и строки кода, где используются 4 основных принципа ООП.

---

## 1️⃣ НАСЛЕДОВАНИЕ (Inheritance)

### Frontend: React Component Inheritance

**Файл:** `lang-frontend/src/components/ErrorBoundary.jsx`

- **Строки 5-38:** Класс `ErrorBoundaryClass` наследует `React.Component`
  ```jsx
  class ErrorBoundaryClass extends React.Component {  // ← Наследование
    constructor(props) {
      super(props);  // ← Вызов конструктора родителя
      this.state = { hasError: false, error: null, errorInfo: null };
    }
  
    static getDerivedStateFromError(error) {
      return { hasError: true };
    }
  
    componentDidCatch(error, errorInfo) {
      // Метод из React.Component
    }
  
    render() {
      // Метод из React.Component
    }
  }
  ```

### Backend: Sequelize Models (ORM Inheritance)

**Файл:** `lang-backend/models/userModel.js`
- **Строки 4-16:** Определение модели User через Sequelize
  ```javascript
  const User = sequelize.define("User", {  // ← Наследование от Model
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    // ...
  });
  ```

**Файл:** `lang-backend/models/courseModel.js`
- **Строки 5-15:** Определение модели Course через Sequelize
  ```javascript
  const Course = sequelize.define("Course", {  // ← Наследование от Model
    // ...
  });
  ```
- **Строки 17-18:** Связи между моделями (ассоциации наследования)
  ```javascript
  User.hasMany(Course, { foreignKey: "authorId" });  // ← Связь "один ко многим"
  Course.belongsTo(User, { as: "author", foreignKey: "authorId" });  // ← Обратная связь
  ```

---

## 2️⃣ ИНКАПСУЛЯЦИЯ (Encapsulation)

### Backend: Модульная инкапсуляция

**Файл:** `lang-backend/utils/logger.js`
- **Строки 4-28:** Объект logger с инкапсулированными методами
  ```javascript
  const logger = {  // ← Приватный модуль (скрывает реализацию)
    info: (message, data = {}) => {
      // Детали реализации скрыты
    },
    error: (message, error = {}) => {
      // Детали реализации скрыты
    },
    // ...
  };
  module.exports = logger;  // ← Экспорт только интерфейса
  ```

**Файл:** `lang-backend/middleware/authMiddleware.js`
- **Строки 4-18:** Middleware функция (инкапсулирует логику проверки токена)
  ```javascript
  module.exports = (req, res, next) => {  // ← Инкапсуляция логики аутентификации
    const authHeader = req.headers.authorization;
    // Вся логика проверки токена скрыта внутри
    // Внешний код не знает деталей реализации
  };
  ```

**Файл:** `lang-backend/middleware/validateInput.js`
- **Строки 4-14:** Приватная функция `handleValidationErrors`
  ```javascript
  const handleValidationErrors = (req, res, next) => {  // ← Приватная функция
    // Доступна только внутри модуля
  };
  ```
- **Строки 17-31, 34-43, 46-59, 62-67, 70-79:** Экспортируемые валидаторы
  ```javascript
  exports.validateRegister = [...];  // ← Публичный интерфейс
  exports.validateLogin = [...];
  // Приватные детали валидации скрыты
  ```

### Frontend: API Client Encapsulation

**Файл:** `lang-frontend/src/api/index.js`
- **Строки 16-207:** Приватная функция `apiRequest` (не экспортируется)
  ```javascript
  async function apiRequest(endpoint, method, body, token, options) {  // ← Приватная функция
    // Вся сложная логика HTTP запросов, retry, кэширование скрыта
    // Внешний код не видит реализацию
  }
  ```
- **Строки 35-77:** Приватная функция `getEnglishName` (доступна только внутри модуля)
  ```javascript
  const getEnglishName = (name) => {  // ← Приватная функция
    // Логика преобразования имен скрыта
  };
  ```
- **Строки 92-101:** Приватная функция `maskPassword` (скрывает пароли в логах)
  ```javascript
  const maskPassword = (data) => {  // ← Приватная функция
    // Логика маскировки скрыта от внешнего кода
  };
  ```
- **Строки 210-340:** Публичные объекты с методами (открытый интерфейс)
  ```javascript
  export const auth = {  // ← Публичный интерфейс
    register: async (userData) => { ... },
    login: async (email, password) => { ... },
    // Детали реализации скрыты в apiRequest
  };
  ```

### Frontend: Context Encapsulation

**Файл:** `lang-frontend/src/contexts/AuthContext.jsx`
- **Строки 7-50:** Компонент `AuthProvider` инкапсулирует состояние авторизации
  ```jsx
  export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);  // ← Приватное состояние
    const [loading, setLoading] = useState(true);
    
    const loadUser = async () => {  // ← Приватная функция
      // Логика загрузки пользователя скрыта
    };
    
    const login = async (email, password) => {  // ← Публичный метод
      // Детали реализации скрыты
    };
    
    return (
      <AuthContext.Provider value={{ user, loading, login, logout, loadUser }}>
        {children}
      </AuthContext.Provider>
    );
  }
  ```
- **Строки 53-59:** Хук `useAuth` предоставляет доступ к инкапсулированному контексту
  ```jsx
  export const useAuth = () => {  // ← Публичный интерфейс
    const context = useContext(AuthContext);
    // Скрывает детали работы с контекстом
  };
  ```

---

## 3️⃣ ПОЛИМОРФИЗМ (Polymorphism)

### Backend: Middleware Polymorphism

**Файл:** `lang-backend/middleware/validateInput.js`
- **Строки 17-31:** `validateRegister` - один интерфейс
- **Строки 34-43:** `validateLogin` - другой интерфейс
- **Строки 46-59:** `validateProgress` - третий интерфейс
- **Все используют один формат:** массив middleware функций `[..., handleValidationErrors]`
  ```javascript
  exports.validateRegister = [  // ← Полиморфизм: один формат
    body("email").isEmail(),
    // ...
    handleValidationErrors,
  ];
  
  exports.validateLogin = [  // ← Разная реализация, тот же формат
    body("email").isEmail(),
    // ...
    handleValidationErrors,
  ];
  ```

**Файл:** `lang-backend/middleware/authMiddleware.js`
- **Строки 4-18:** Middleware функция с форматом `(req, res, next) => {}`
  ```javascript
  module.exports = (req, res, next) => {  // ← Стандартный интерфейс Express
    // Может использоваться вместо других middleware с тем же интерфейсом
  };
  ```

**Файл:** `lang-backend/middleware/errorHandler.js`
- **Строки 3-20:** Middleware обработки ошибок с тем же интерфейсом
  ```javascript
  module.exports = (err, req, res, next) => {  // ← Полиморфизм: другой интерфейс
    // Разная реализация, но работает как middleware
  };
  ```

**Файл:** `lang-backend/routes/progress.js`
- **Строка 12:** Использование полиморфизма - несколько middleware подряд
  ```javascript
  router.get("/user/:user_id", 
    authMiddleware,      // ← Middleware 1
    checkOwnership,      // ← Middleware 2
    validateUserId,      // ← Middleware 3 (массив)
    pagination,          // ← Middleware 4
    async (req, res) => { ... }
  );
  ```

### Frontend: API Methods Polymorphism

**Файл:** `lang-frontend/src/api/index.js`
- **Строки 210-240:** Все методы `auth` используют одну функцию `apiRequest`
  ```javascript
  export const auth = {
    register: async (userData) => {
      return apiRequest("/auth/register", "POST", userData, ...);  // ← Разные параметры
    },
    login: async (email, password) => {
      return apiRequest("/auth/login", "POST", { email, password }, ...);  // ← Разные параметры
    },
    // Все используют один метод apiRequest, но с разными параметрами
  };
  ```

---

## 4️⃣ АБСТРАКЦИЯ (Abstraction)

### Frontend: API Client Abstraction

**Файл:** `lang-frontend/src/api/index.js`
- **Строки 210-240:** Объект `auth` абстрагирует HTTP запросы
  ```javascript
  export const auth = {  // ← Абстракция: скрывает детали HTTP
    login: async (email, password) => {
      // Пользователь не знает про fetch, headers, токены
      // Просто вызывает auth.login()
    }
  };
  ```
- **Строки 243-258:** Объект `courses` абстрагирует работу с курсами
  ```javascript
  export const courses = {
    getAll: async () => {
      // Скрывает детали: кэширование, retry, URL формирование
    }
  };
  ```

### Backend: Model Abstraction

**Файл:** `lang-backend/models/userModel.js`
- **Строки 4-16:** Модель User абстрагирует работу с БД
  ```javascript
  const User = sequelize.define("User", {  // ← Абстракция БД
    // Скрывает детали SQL запросов
    // Предоставляет простой интерфейс: User.create(), User.findAll()
  });
  ```

**Файл:** `lang-backend/models/courseModel.js`
- **Строки 5-15:** Модель Course абстрагирует таблицу courses
- **Строки 17-18:** Связи абстрагируют JOIN запросы
  ```javascript
  User.hasMany(Course);  // ← Абстракция: скрывает SQL JOIN
  // Вместо сложного SQL просто: user.getCourses()
  ```

### Backend: Logger Abstraction

**Файл:** `lang-backend/utils/logger.js`
- **Строки 4-26:** Объект logger абстрагирует логирование
  ```javascript
  const logger = {  // ← Абстракция: скрывает детали форматирования
    info: (message, data) => {
      // Скрывает: формат даты, уровень, структуру
      // Простой интерфейс: logger.info("message", data)
    }
  };
  ```

### Frontend: Context Abstraction

**Файл:** `lang-frontend/src/contexts/AuthContext.jsx`
- **Строки 7-50:** `AuthProvider` абстрагирует управление состоянием
  ```jsx
  export function AuthProvider({ children }) {
    // Скрывает: localStorage, API вызовы, обработку ошибок
    // Простой интерфейс: { user, loading, login, logout }
  }
  ```
- **Строки 53-59:** Хук `useAuth` абстрагирует доступ к контексту
  ```jsx
  export const useAuth = () => {  // ← Абстракция контекста
    // Скрывает: useContext, проверки, ошибки
    // Простой интерфейс: const { user } = useAuth()
  };
  ```

---

## 📋 Краткая шпаргалка: Какие файлы открыть

### Для демонстрации всех принципов:

1. **Наследование:**
   - `lang-frontend/src/components/ErrorBoundary.jsx` (строки 5-38)
   - `lang-backend/models/courseModel.js` (строки 17-18)

2. **Инкапсуляция:**
   - `lang-frontend/src/api/index.js` (строки 16-207 - приватные функции, 210-340 - публичные)
   - `lang-backend/utils/logger.js` (все строки)
   - `lang-frontend/src/contexts/AuthContext.jsx` (строки 7-50)

3. **Полиморфизм:**
   - `lang-backend/middleware/validateInput.js` (строки 17-79)
   - `lang-backend/routes/progress.js` (строка 12)

4. **Абстракция:**
   - `lang-frontend/src/api/index.js` (строки 210-340)
   - `lang-backend/models/userModel.js` (все строки)
   - `lang-frontend/src/contexts/AuthContext.jsx` (строки 53-59)

