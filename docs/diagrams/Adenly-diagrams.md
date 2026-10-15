# Диаграммы Adenly

Модели составлены по исходному коду Adenly: `lang-backend/index.js`, `routes/auth.js`, `routes/tests.js`, `db/init.sql`, `db/migration_add_user_errors.sql` и маршрутам API. Это описание структуры и логики, а не подтверждение работы всех сценариев.

DFD и ER представлены в поддерживаемой Mermaid записи. IDEF1, IDEF2 и IDEF3 представлены как содержательные модели с условными обозначениями Mermaid; это адаптация для просмотра, а не строгая графическая нотация стандарта. Для IDEF2 дан проект динамической модели: замеры времени и имитационные эксперименты не выполнялись.

## DFD — контекстный уровень

```mermaid
flowchart LR
 U[Пользователь] -->|Регистрационные данные, запросы обучения, ответы, сообщения| P((0. Adenly))
 P -->|Материалы, результаты, прогресс, сертификаты, ответы AI| U
 A[Администратор] -->|Данные курсов, уроков и тестов| P
 P -->|Результаты управления контентом| A
 P -->|Адрес и содержание письма| M[Почтовый сервис]
 M -->|Результат SMTP-запроса| P
 M -->|Письмо со ссылкой| U
 P -->|Контекст и сообщение| G[Groq API]
 G -->|Ответ модели| P
```

Прямоугольники — внешние участники; круги — процессы; цилиндры — логические хранилища PostgreSQL. Подписи стрелок обозначают передаваемые данные. Фронтенд и API входят в границу системы Adenly.

## DFD — декомпозиция первого уровня

```mermaid
flowchart LR
 U[Пользователь] -->|Email, пароль, токен| P1((1. Учетная запись))
 P1 -->|JWT, профиль, результат проверки| U
 P1 -->|Новая учетная запись, изменение профиля| D1[(D1 Пользователи)]
 D1 -->|Профиль и хеш пароля| P1
 P1 -->|Письмо подтверждения или сброса| M[Почтовый сервис]
 M -->|Статус SMTP| P1
 M -->|Ссылка| U
 A[Администратор] -->|Контент| P2((2. Каталог и уроки))
 P2 -->|Результат изменения| A
 U -->|Запрос курса или урока| P2
 D2[(D2 Курсы и уроки)] -->|Материалы| P2
 P2 -->|Изменения контента| D2
 P2 -->|Каталог и уроки| U
 U -->|Завершение урока| P3((3. Прогресс и достижения))
 D3[(D3 Прогресс и достижения)] -->|Текущие показатели| P3
 P3 -->|Обновленные показатели| D3
 P3 -->|Прогресс, XP, уровень| U
 A -->|Вопросы и критерии| P4((4. Тестирование))
 P4 -->|Результат создания теста| A
 U -->|Запрос теста и ответы| P4
 D4[(D4 Тесты, вопросы, ответы, попытки)] -->|Задания, ключи, история| P4
 P4 -->|Тесты, попытки и ответы пользователя| D4
 P4 -->|Вопросы, оценка, результат| U
 P4 -->|Сертификат и уведомление| D5[(D5 Сертификаты и уведомления)]
 P4 -->|Начисление XP| D3
 U -->|Запрос документов и уведомлений| P5((5. Документы и уведомления))
 D5 -->|Документы и уведомления| P5
 P5 -->|Статус прочтения| D5
 P5 -->|Сертификаты и уведомления| U
 U -->|Сообщение и запрос анализа ошибок| P6((6. AI-практика))
 D6[(D6 Ошибки и диалоги)] -->|История и ошибки| P6
 P6 -->|История и ошибки| D6
 P6 -->|Контекст и запрос| G[Groq API]
 G -->|Ответ модели| P6
 P6 -->|Диалог и рекомендации| U
 U -->|Обращение| P7((7. Обратная связь))
 P7 -->|Обращение| D7[(D7 Обратная связь)]
 P7 -->|Подтверждение приема| U
```

Прямоугольники — внешние участники; круги — процессы; цилиндры — логические хранилища PostgreSQL. Подписи стрелок обозначают передаваемые данные. Фронтенд и API входят в границу системы Adenly.

## IDEF1 — информационная модель

```mermaid
flowchart LR
 U[Пользователь: личность, email, роль, подтверждение]
 C[Курс: название, языки, описание]
 L[Урок: содержание и медиа]
 P[Прогресс: состояние изучения урока]
 T[Тест: критерии и ограничения]
 Q[Вопрос и варианты ответа]
 AT[Попытка: результат прохождения]
 R[Ответ пользователя: выбор или текст, баллы]
 CE[Сертификат: номер и дата выдачи]
 AC[Достижения: XP, уровень, число уроков]
 N[Уведомление: сообщение и прочтение]
 E[Ошибка обучения: тип, контекст, исправление]
 AI[AI-диалог: язык, сообщения, оценка]
 F[Обращение: контакты, тема, статус]
 C -->|объединяет| L
 U -->|имеет историю обучения| P
 L -->|является объектом учета| P
 C -->|проверяется посредством| T
 T -->|содержит| Q
 U -->|выполняет| AT
 T -->|определяет задание для| AT
 AT -->|содержит| R
 Q -->|задает смысл| R
 U -->|получает| CE
 C -->|указан в| CE
 T -->|основание выдачи| CE
 U -->|накапливает| AC
 U -->|получает| N
 U -->|допускает| E
 U -->|ведет| AI
 C -->|контекст| E
 L -->|контекст| E
 C -->|контекст| AI
 L -->|контекст| AI
 U -->|может быть автором| F
```

Модель показывает смысл информации и отношения предметной области, без физических ключей и типов SQL. Подписки/зачисления на курс отдельной сущностью в БД не представлены. Связь сертификата с конкретной попыткой логически возможна, но отдельного внешнего ключа attempt_id в коде нет.

## IDEF2 — динамическая модель обработки запросов

```mermaid
flowchart LR
 S[Источник: действия пользователей, интенсивность λ] --> A[Поступление HTTP-запросов]
 A --> L{Rate limit}
 L -->|Лимит превышен| X[HTTP 429]
 L -->|Разрешено| W[Ожидание обработки в Node.js]
 W --> R{Тип запроса}
 R -->|Каталог, прогресс, тест| Q[Ожидание соединения пула PostgreSQL]
 Q --> DB[Выполнение SQL: время t_db]
 DB --> B[Формирование HTTP-ответа]
 R -->|AI-диалог| G[Ожидание Groq API: время t_ai]
 G --> Q
 R -->|Регистрация| H[Хеширование пароля: время t_hash]
 H --> Q2[Создание пользователя в PostgreSQL]
 Q2 --> M[Ожидание почтового сервиса: время t_mail]
 M --> B
 B --> END[Запрос завершен: время T]
```

Это качественная схема динамической модели, а не стандартная диаграмма состояний и не выполненная симуляция. Ожидание в Node.js обозначает планирование обработки, а не отдельный реализованный брокер сообщений. Параметры для измерения: λ (запросов/с), t_db, t_hash, t_mail, t_ai, размер пула БД, доли типов запросов и ограничения rate limit. Выходы: время ответа T, пропускная способность, число ожидающих запросов, доля 429 и ошибок. Эксперименты: обычная нагрузка, всплеск запросов, медленная БД, задержка AI. Числовые значения не назначались. Для обычного запроса T приблизительно равно сумме ожидания обработки, ожидания соединения, SQL и формирования ответа; это аналитическое приближение.

## IDEF3 — описание процесса обучения

```mermaid
flowchart TD
 S([Начало]) --> A[UOB 1. Отправить данные регистрации]
 A --> J1{XOR: данные допустимы и email свободен?}
 J1 -->|Нет| E1[Исправить данные]
 E1 --> A
 J1 -->|Да| B[UOB 2. Создать пользователя и инициировать отправку письма]
 B --> C[UOB 3. Перейти по ссылке подтверждения]
 C --> J2{XOR: токен действителен?}
 J2 -->|Нет| E2[Подтверждение отклонено]
 J2 -->|Да| D[UOB 4. Подтвердить email]
 D --> E[UOB 5. Выполнить вход]
 E --> J3{XOR: вход разрешен?}
 J3 -->|Нет| E
 J3 -->|Да| F[UOB 6. Выбрать курс и открыть урок]
 F --> G[UOB 7. Изучить материал и сохранить прогресс]
 G --> H[UOB 8. Запросить начало теста]
 H --> J4{XOR: тест существует и лимит попыток не достигнут?}
 J4 -->|Нет| STOP[Начало теста отклонено]
 J4 -->|Да| I[UOB 9. Получить вопросы и отправить ответы]
 I --> K[UOB 10. Сохранить попытку и рассчитать оценку]
 K --> J5{XOR: оценка не ниже passing_score?}
 J5 -->|Нет| FAIL[UOB 11. Показать результат без сертификата]
 FAIL --> CH{XOR: повторить?}
 CH -->|Да| H
 CH -->|Нет| FIN([Завершение])
 J5 -->|Да| CERT[UOB 12. Создать сертификат]
 CERT --> XP[UOB 13. Попытаться обновить XP]
 XP --> N[UOB 14. Попытаться создать уведомление]
 N --> RES[UOB 15. Вернуть результат и сертификат]
 RES --> FIN
```

UOB — единица поведения, стрелки — предшествование, XOR — выбор одного пути. Диаграмма отражает штатный сценарий; полный граф исключений HTTP/SQL не показан. Проверка лимита попыток находится в GET /:testId/start; POST /:testId/submit повторно ее не выполняет. Время time_taken приходит от клиента; started_at и completed_at записываются при отправке ответов. Ошибки начисления XP и создания уведомления перехватываются отдельно и не отменяют успешную выдачу сертификата. Начисление XP использует UPDATE и не создает отсутствующую запись achievements.

## ER — физическая модель PostgreSQL

```mermaid
erDiagram
    courses |o--o{ lessons : "course_id"
    users |o--o{ notifications : "user_id"
    users |o--o{ progress : "user_id"
    courses |o--o{ progress : "course_id"
    lessons |o--o{ progress : "lesson_id"
    users |o--o{ achievements : "user_id"
    courses |o--o{ tests : "course_id"
    tests |o--o{ test_questions : "test_id"
    test_questions |o--o{ test_answers : "question_id"
    tests |o--o{ test_attempts : "test_id"
    users |o--o{ test_attempts : "user_id"
    test_attempts |o--o{ test_responses : "attempt_id"
    test_questions |o--o{ test_responses : "question_id"
    test_answers |o--o{ test_responses : "answer_id"
    users |o--o{ certificates : "user_id"
    courses |o--o{ certificates : "course_id"
    tests |o--o{ certificates : "test_id"
    users |o--o{ feedback : "user_id"
    users |o--o{ user_errors : "user_id"
    courses |o--o{ user_errors : "course_id"
    lessons |o--o{ user_errors : "lesson_id"
    users |o--o{ ai_conversations : "user_id"
    courses |o--o{ ai_conversations : "course_id"
    lessons |o--o{ ai_conversations : "lesson_id"
    users {
        serial id PK
        varchar email UK
        text password
        varchar name
        varchar role
        boolean is_verified
        timestamp created_at
        jsonb settings
    }
    courses {
        serial id PK
        varchar title
        text description
        varchar language_from
        varchar language_to
        timestamp created_at
    }
    lessons {
        serial id PK
        integer course_id FK
        varchar title
        text content
        varchar media_url
        timestamp created_at
    }
    notifications {
        serial id PK
        integer user_id FK
        text message
        varchar type
        boolean is_read
        timestamp created_at
    }
    progress {
        serial id PK
        int user_id FK
        int course_id FK
        int lesson_id FK
        boolean completed
        varchar status
        timestamp updated_at
    }
    achievements {
        serial id PK
        integer user_id FK
        integer xp
        integer level
        integer lessons_completed
        timestamp created_at
        timestamp updated_at
    }
    tests {
        serial id PK
        integer course_id FK
        varchar title
        text description
        integer passing_score
        integer time_limit
        integer max_attempts
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    test_questions {
        serial id PK
        integer test_id FK
        text question_text
        varchar question_type
        integer points
        integer order_index
        timestamp created_at
    }
    test_answers {
        serial id PK
        integer question_id FK
        text answer_text
        boolean is_correct
        integer order_index
        timestamp created_at
    }
    test_attempts {
        serial id PK
        integer test_id FK
        integer user_id FK
        integer score
        integer total_questions
        integer correct_answers
        timestamp started_at
        timestamp completed_at
        integer time_taken
        boolean passed
    }
    test_responses {
        serial id PK
        integer attempt_id FK
        integer question_id FK
        integer answer_id FK
        text user_answer
        boolean is_correct
        integer points_earned
        timestamp created_at
    }
    certificates {
        serial id PK
        integer user_id FK
        integer course_id FK
        integer test_id FK
        varchar certificate_number UK
        timestamp issued_at
        timestamp expires_at
        jsonb metadata
        timestamp created_at
    }
    feedback {
        serial id PK
        integer user_id FK
        varchar name
        varchar email
        varchar subject
        text message
        varchar category
        varchar status
        timestamp created_at
    }
    user_errors {
        serial id PK
        integer user_id FK
        integer course_id FK
        integer lesson_id FK
        varchar error_type
        text error_text
        text correct_text
        text context
        jsonb metadata
        timestamp created_at
    }
    ai_conversations {
        serial id PK
        integer user_id FK
        integer course_id FK
        integer lesson_id FK
        varchar language
        varchar topic
        jsonb messages
        jsonb metadata
        integer duration_seconds
        integer score
        text feedback
        timestamp created_at
    }
```

Показаны все 15 таблиц из init.sql и AI-миграции; settings добавляется при старте API. PK — первичный ключ, FK — внешний ключ, UK — уникальное поле. У каждого родителя может быть 0..N дочерних записей. Все объявленные FK допускают NULL, поэтому на стороне родителя указано 0..1; обязательность связей на уровне интерфейса может быть строже. Дополнительные составные UNIQUE: progress(user_id, lesson_id) и test_attempts(test_id, user_id, started_at). achievements.user_id не имеет UNIQUE: физическая схема допускает несколько записей достижений на пользователя. Для компактности длины VARCHAR, значения по умолчанию и правила удаления здесь опущены; точные ограничения находятся в SQL.

