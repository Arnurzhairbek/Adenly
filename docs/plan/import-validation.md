# Adenly — импортты тексеру нәтижесі

09.10.2026. PR #11 main тармағына merge commit `0482bcae679ce77217e9d5883dd7099409cb80bc` арқылы енгізілді.

[CI run 37907082585](https://github.com/Arnurzhairbek/Adenly/actions/runs/37907082585) код commit `791a92bbb5973b13ecc98929414403a1e5a636d3` үшін frontend, backend және Docker тапсырмаларын сәтті орындады.

## Не түзетілді
- PostgreSQL сыртқы порт 5433, контейнер ішкі порт 5432. Backend ішкі 5432 портына қосылады.
- Linux регистрі: LeaderBoard.jsx импорт атауы сәйкестендірілді.
- npm ci үшін frontend/backend lockfiles сақталды. Қолданылмайтын better-sqlite3 алынды. Docker Node 22 қолданады.
- CI main және import тармағын, Pull Request-терді тексереді. Түбірдегі жоқ Dockerfile орнына docker compose build қолданылады.
- .dockerignore жергілікті .env, node_modules, uploads, дерекқор файлдарын image-ке қоспайды.
- Health endpoint PostgreSQL бастапқы инициализациясы аяқталғанша 503 береді.
- Тіркелуде admin рөлін еркін беру жабылды. Access, verify-email және reset-password токен мақсаттары бөлінді. Admin маршруттары алдымен аутентификация жасайды. Notifications POST токендегі user_id-мен ғана жазады.

## Тексеру дәлелі
Backend-та 28 тексеру: тіркеу валидациясы, duplicate email, bcrypt хэш, email растауы, қате пароль, access JWT, токенсіз және мерзімі өткен токен, әкімші құқығы, курстар, сабақ мазмұны, жоқ сабақ, прогресстің иеленуі, хабарландыру сақтау мен иеленуі. PostgreSQL 16 нақты сервисі қолданылды.

Docker жинағы жиналды. PostgreSQL, backend және frontend health checks өтті. HTTP арқылы frontend, /health және /api/courses жауап берді.

## Шектеулер және қалған жұмыс
SMTP жеткізуі тестте алмастырылған. Email жеткізуі, браузер UI, мобильді өлшемдер және барлық Story acceptance criteria толық тексерілмеді. Profile.jsx сақтау әрекеті әзірге placeholder. №6 талап еткен /api/courses/:id/lessons маршруты жоқ, қолданыстағы маршрут /api/lessons/course/:courseId.

Қолданыстағы пайдаланушылар қайта кіруі керек: ескі JWT-де purpose өрісі жоқ. SMTP мен AI кілттерін пайдаланушы ортасында баптау қажет. Үлгі құпия мәндер өндірістік құпия ретінде қолданылмайды.

Алғашқы #1–#10 Issue-ден тек #1 және #2 жабылды. Қалған сегізінің тексеру дәлелі Issue body-де тіркелді. Монте-Карло және Planning Poker деректерінің расталмаған бөлігі құжатта ашық көрсетілді.
