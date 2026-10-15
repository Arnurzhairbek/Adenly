# Adenly диаграммалары

[Орысша нұсқа](../Adenly-diagrams.md)

Модельдер Adenly бастапқы коды мен SQL схемасына негізделген. DFD және ER Mermaid арқылы берілген. IDEF1, IDEF2 және IDEF3 — Mermaid графикасына бейімделген мазмұндық модельдер; қатаң стандарттық графикалық нотация емес. IDEF2 үшін уақыт өлшемдері жүргізілмеген.

## DFD — контекстік деңгей

```mermaid
flowchart LR
 U[Пайдаланушы] -->|Тіркелу деректері, оқу сұраулары, жауаптар, хабарлар| P((0. Adenly))
 P -->|Материалдар, нәтижелер, оқу барысы, сертификаттар, ЖИ жауаптары| U
 A[Әкімші] -->|Курстардың, сабақтардың және тесттердің деректері| P
 P -->|Мазмұнды басқару нәтижелері| A
 P -->|Хаттың мекенжайы мен мазмұны| M[Пошта қызметі]
 M -->|SMTP сұрауының нәтижесі| P
 M -->|Сілтемесі бар хат| U
 P -->|Мәнмәтін және хабар| G[Groq API]
 G -->|Модель жауабы| P
```

Тік төртбұрыштар — сыртқы қатысушылар, дөңгелек — Adenly жүйесі. Көрсеткілер деректердің қозғалысын білдіреді. Фронтенд пен API жүйе шекарасына кіреді.

## DFD — бірінші деңгейдегі жіктеу

```mermaid
flowchart LR
 U[Пайдаланушы] -->|Email, құпиясөз, токен| P1((1. Тіркелгі))
 P1 -->|JWT, профиль, тексеру нәтижесі| U
 P1 -->|Жаңа тіркелгі, профильді өзгерту| D1[(D1 Пайдаланушылар)]
 D1 -->|Профиль және құпиясөз хеші| P1
 P1 -->|Растау немесе қалпына келтіру хаты| M[Пошта қызметі]
 M -->|SMTP күйі| P1
 M -->|Сілтеме| U
 A[Әкімші] -->|Мазмұн| P2((2. Каталог және сабақтар))
 P2 -->|Өзгерту нәтижесі| A
 U -->|Курс немесе сабақ сұрауы| P2
 D2[(D2 Курстар мен сабақтар)] -->|Материалдар| P2
 P2 -->|Мазмұн өзгерістері| D2
 P2 -->|Каталог және сабақтар| U
 U -->|Сабақты аяқтау| P3((3. Оқу барысы мен жетістіктер))
 D3[(D3 Оқу барысы мен жетістіктер)] -->|Ағымдағы көрсеткіштер| P3
 P3 -->|Жаңартылған көрсеткіштер| D3
 P3 -->|Оқу барысы, XP, деңгей| U
 A -->|Сұрақтар мен бағалау өлшемдері| P4((4. Тестілеу))
 P4 -->|Тест құру нәтижесі| A
 U -->|Тест сұрауы және жауаптар| P4
 D4[(D4 Тесттер, сұрақтар, жауаптар, талпыныстар)] -->|Тапсырмалар, жауап кілттері, тарих| P4
 P4 -->|Тесттер, талпыныстар және пайдаланушы жауаптары| D4
 P4 -->|Сұрақтар, баға, нәтиже| U
 P4 -->|Сертификат және хабарлама| D5[(D5 Сертификаттар мен хабарламалар)]
 P4 -->|XP ұпайларын қосу| D3
 U -->|Құжаттар мен хабарламалар сұрауы| P5((5. Құжаттар мен хабарламалар))
 D5 -->|Құжаттар мен хабарламалар| P5
 P5 -->|Оқылу күйі| D5
 P5 -->|Сертификаттар мен хабарламалар| U
 U -->|Хабар және қателерді талдау сұрауы| P6((6. ЖИ арқылы жаттығу))
 D6[(D6 Қателер мен диалогтар)] -->|Тарих және қателер| P6
 P6 -->|Тарих және қателер| D6
 P6 -->|Мәнмәтін және сұрау| G[Groq API]
 G -->|Модель жауабы| P6
 P6 -->|Диалог және ұсыныстар| U
 U -->|Өтініш| P7((7. Кері байланыс))
 P7 -->|Өтініш| D7[(D7 Кері байланыс)]
 P7 -->|Қабылдауды растау| U
```

Дөңгелектер — үдерістер; цилиндрлер — PostgreSQL ішіндегі логикалық деректер қоймалары. Көрсеткі атаулары берілетін деректерді сипаттайды.

## IDEF1 — ақпараттық модель

```mermaid
flowchart LR
 U[Пайдаланушы: жеке деректер, email, рөл, растау]
 C[Курс: атауы, тілдер, сипаттама]
 L[Сабақ: мазмұн және медиа]
 P[Оқу барысы: сабақты меңгеру күйі]
 T[Тест: бағалау өлшемдері мен шектеулер]
 Q[Сұрақ және жауап нұсқалары]
 AT[Талпыныс: тапсыру нәтижесі]
 R[Пайдаланушы жауабы: таңдау немесе мәтін, ұпайлар]
 CE[Сертификат: нөмірі мен берілген күні]
 AC[Жетістіктер: XP, деңгей, сабақтар саны]
 N[Хабарлама: мәтін және оқылуы]
 E[Оқу қатесі: түрі, мәнмәтіні, түзетуі]
 AI[ЖИ диалогы: тіл, хабарлар, баға]
 F[Өтініш: байланыс деректері, тақырып, күй]
 C -->|біріктіреді| L
 U -->|оқу тарихы бар| P
 L -->|есепке алу нысаны| P
 C -->|арқылы тексеріледі| T
 T -->|қамтиды| Q
 U -->|орындайды| AT
 T -->|тапсырманы анықтайды| AT
 AT -->|қамтиды| R
 Q -->|мағынасын анықтайды| R
 U -->|алады| CE
 C -->|көрсетіледі| CE
 T -->|беруге негіз болады| CE
 U -->|жинақтайды| AC
 U -->|алады| N
 U -->|жібереді| E
 U -->|жүргізеді| AI
 C -->|мәнмәтін| E
 L -->|мәнмәтін| E
 C -->|мәнмәтін| AI
 L -->|мәнмәтін| AI
 U -->|авторы болуы мүмкін| F
```

Модель ақпараттың мағынасы мен пәндік саладағы байланыстарды көрсетеді. SQL кілттері мен физикалық түрлер келтірілмейді. Курсқа жазылуға арналған жеке кесте жоқ. Сертификатта нақты талпынысқа сілтейтін attempt_id сыртқы кілті жоқ.

## IDEF2 — сұрауларды өңдеудің динамикалық моделі

```mermaid
flowchart LR
 S[Көз: пайдаланушы әрекеттері, қарқындылық λ] --> A[HTTP сұрауларының келуі]
 A --> L{Сұрау жиілігінің шегі}
 L -->|Шектен асты| X[HTTP 429]
 L -->|Рұқсат етілді| W[Node.js ішінде өңдеуді күту]
 W --> R{Сұрау түрі}
 R -->|Каталог, оқу барысы, тест| Q[PostgreSQL пулынан қосылымды күту]
 Q --> DB[SQL орындау: t_db уақыты]
 DB --> B[HTTP жауабын қалыптастыру]
 R -->|ЖИ диалогы| G[Groq API жауабын күту: t_ai уақыты]
 G --> Q
 R -->|Тіркелу| H[Құпиясөзді хештеу: t_hash уақыты]
 H --> Q2[PostgreSQL ішінде пайдаланушыны құру]
 Q2 --> M[Пошта қызметін күту: t_mail уақыты]
 M --> B
 B --> END[Сұрау аяқталды: T уақыты]
```

Бұл — динамикалық модельдің сапалық жобасы; имитациялық модельдеу мен уақыт өлшемдері жүргізілген жоқ. Node.js ішіндегі күту жеке хабарлар брокерін білдірмейді. Өлшенетін параметрлер: λ — секундына келетін сұраулар; t_db — SQL уақыты; t_hash — хештеу уақыты; t_mail — пошта қызметін күту; t_ai — ЖИ жауабын күту; қосылым пулының өлшемі және сұраулардың түрлері бойынша үлесі. Нәтижелік көрсеткіштер: T жауап уақыты, өткізу қабілеті, күтіп тұрған сұраулар саны, 429 жауаптары мен қателер үлесі. Тәжірибелер: қалыпты жүктеме, сұраулардың күрт өсуі, баяу дерекқор, ЖИ кідірісі. Сандық мәндер тағайындалмаған.

## IDEF3 — оқу үдерісінің сипаттамасы

```mermaid
flowchart TD
 S([Басталуы]) --> A[UOB 1. Тіркелу деректерін жіберу]
 A --> J1{XOR: деректер дұрыс және email бос па?}
 J1 -->|Жоқ| E1[Деректерді түзету]
 E1 --> A
 J1 -->|Иә| B[UOB 2. Пайдаланушыны құру және хат жіберуді бастау]
 B --> C[UOB 3. Растау сілтемесіне өту]
 C --> J2{XOR: токен жарамды ма?}
 J2 -->|Жоқ| E2[Растау қабылданбады]
 J2 -->|Иә| D[UOB 4. Email мекенжайын растау]
 D --> E[UOB 5. Жүйеге кіру]
 E --> J3{XOR: кіруге рұқсат бар ма?}
 J3 -->|Жоқ| E
 J3 -->|Иә| F[UOB 6. Курсты таңдау және сабақты ашу]
 F --> G[UOB 7. Материалды оқу және оқу барысын сақтау]
 G --> H[UOB 8. Тестті бастауды сұрау]
 H --> J4{XOR: тест бар және талпыныстар шегі таусылмаған ба?}
 J4 -->|Жоқ| STOP[Тестті бастауға рұқсат берілмеді]
 J4 -->|Иә| I[UOB 9. Сұрақтарды алу және жауаптарды жіберу]
 I --> K[UOB 10. Талпынысты сақтау және бағаны есептеу]
 K --> J5{XOR: баға passing_score шегінен төмен емес пе?}
 J5 -->|Жоқ| FAIL[UOB 11. Нәтижені сертификатсыз көрсету]
 FAIL --> CH{XOR: қайталау керек пе?}
 CH -->|Иә| H
 CH -->|Жоқ| FIN([Аяқталуы])
 J5 -->|Иә| CERT[UOB 12. Сертификат құру]
 CERT --> XP[UOB 13. XP жаңартуға әрекет жасау]
 XP --> N[UOB 14. Хабарлама құруға әрекет жасау]
 N --> RES[UOB 15. Нәтиже мен сертификатты қайтару]
 RES --> FIN
```

UOB — мінез-құлық бірлігі; көрсеткі — орындалу реттілігі; XOR — бір баламаны таңдау. HTTP және SQL қателерінің толық графы көрсетілмеген. Талпыныстар шегі GET /:testId/start кезінде тексеріледі; POST /:testId/submit оны қайта тексермейді. time_taken клиенттен келеді, started_at және completed_at жауап жіберілген сәтте жазылады. XP жаңарту немесе хабарлама құру қатесі сертификаттың берілуін жоймайды. XP үшін UPDATE қолданылады: achievements жазбасы болмаса, жаңа жазба құрылмайды.

## ER — PostgreSQL дерекқорының физикалық моделі

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

init.sql және ЖИ миграциясындағы барлық 15 кесте көрсетілген. users.settings API іске қосылғанда қосылады. PK — бастапқы кілт, FK — сыртқы кілт, UK — бірегей өріс. Бір ата-аналық жазбаға 0..N еншілес жазба сәйкес келеді. Барлық FK өрістерінде NULL рұқсат етілгендіктен, ата-аналық жақта 0..1 белгіленген. Құрама UNIQUE шектеулері: progress(user_id, lesson_id) және test_attempts(test_id, user_id, started_at). achievements.user_id бірегей емес. VARCHAR ұзындықтары, әдепкі мәндер және жою ережелері ықшамдық үшін көрсетілмеген. Кестелер мен бағандардың атаулары кодқа сәйкестігін сақтау үшін ағылшынша қалдырылған.
