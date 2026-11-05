#!/usr/bin/env python3
"""Generate the Kazakh Adenly technical specification and traceability artefacts."""
from pathlib import Path
import csv,json,re,hashlib,zipfile,subprocess
from datetime import date
from semester_plan import section_markdown,write_plan,CURRENT_WEEK,TARGET_WEEK,CURRENT_EVIDENCE

ROOT=Path(__file__).resolve().parent
DATE='05.11.2026'
VERSION='1.1'
# ID, stage, requirement, acceptance test, current evidence/reference
FR=[
('FR-01','D','Синтетикалық аккаунтпен кіру','Расталған synthetic студент дұрыс парольмен кіріп жеке кабинетке өтеді; қате пароль және расталмаған аккаунт қабылданбайды; хабарлама түсінікті.','AT-01','#2; auth/login'),
('FR-02','D','Рөл және жеке деректі оқшаулау','Студент өз профилі/прогресі/талпынысын ғана алады; токенсіз 401, басқа студент дерегіне 403 не ақпарат ашпайтын 404; admin әрекетіне студент 403 алады.','AT-02','#3; authMiddleware; ownership'),
('FR-03','D','Профильді көру','Кабинетте ағымдағы пайдаланушының аты, email және рөлі көрсетіледі; басқа ID арқылы профиль ауыстырылмайды; пароль/хэш көрсетілмейді.','AT-03','#4; GET /auth/me'),
('FR-04','D','Курс каталогы','Кемінде бір келісілген курс атауы, сипаттамасы және тіл жұбымен ашылады; бос каталогта түсінікті бос күй, сервер ақауында қате және қайталау жолы бар.','AT-04','#5; courses'),
('FR-05','D','Курсқа тиесілі сабақтар','Курс ашылғанда тек соның сабақтары id ретімен беріледі; бар бос курс []/200, жоқ курс 404, жарамсыз ID 400; екі қолдау көрсетілетін URL бірдей нәтиже береді.','AT-05','#6; courseLessonsController'),
('FR-06','D','Сабақты оқу','Студент сабақ атауы мен мәтінін оқиды; материал жоқ/жарамсыз болғанда UI бұзылмайды; басқа курс материалы араласпайды; сақталған қауіпті HTML орындалмайды.','AT-06','#7; lesson page'),
('FR-07','D','Прогресті сақтау','Сабақ аяқталуы токендегі пайдаланушыға ғана тіркеледі; course_id сабақтың нақты курсына сай; қайталап сақтау бір lesson үшін екінші progress жазбасын құрмайды; reload нәтижені сақтайды.','AT-07','#9; progress'),
('FR-08','D','Тестті бастау','Бір белсенді тесттің шарттары, сұрақтары, өту шегі және әрекет лимиті көрінеді; дұрыс жауап белгісі клиентке берілмейді; басталу уақыты серверде тіркеледі.','AT-08','#8/#12; tests start'),
('FR-09','D','Тест жауабын қауіпсіз қабылдау','Барлық сұрақ осы тестке, әр answer_id өз question_id-іне тиесілі; қайталанған/бөтен/жетіспейтін жауап, жабық тест, лимиттен асу және серверлік уақыт шегінен кеш submit қабылданбайды; ішінара нәтиже қалмайды.','AT-09','#12 SEC-01'),
('FR-10','D','Бағалау және талпыныс тұтастығы','score=round(100×жиналған балл/ең жоғары балл); мүмкін балл>0; score≥passing_score болса passed=true. Параллель/қайталанған submit бір талпынысты екі рет бағаламайды; answers/attempt/certificate өзгерісі транзакциямен сақталады.','AT-10','#8/#12; test_attempts'),
('FR-11','D','Тест нәтижесін қайта көру','Студент өз нәтижесін, пайызын және өткен/өтпеген күйін reload-тан кейін көреді; бөтен attempt оқылмайды; нәтижені сұрау жаңа талпыныс құрмайды.','AT-11','#8; attempts'),
('FR-12','D','Базалық сертификат','Келісілген тесттен өткен synthetic студент үшін бірегей нөмірі, аты, курс және күні бар базалық PDF алынады; өтпеген нәтижеге берілмейді; бір нәтижені қайталау дубликат тудырмайды.','AT-12','certificates; #12'),
('FR-13','D','Демо контенті және әкімші шекарасы','Бір курс/тіл жұбы, кемінде бір сабақ және ≥3 single-choice сұрағы бар бір тест келісілген synthetic seed арқылы жүктеледі; студент контентті өзгерте алмайды; admin құпиясы Git-те сақталмайды.','AT-13','db/init.sql; seed; adminMiddleware'),
('FR-14','D','Қолданылмайтын мүмкіндіктерді ажырату','Жабық демода сыртқы ЖИ шақыруы және қолданылмайтын upload endpoint-тері сервер деңгейінде өшіріледі; UI жасыру жеткіліксіз; тікелей HTTP теріс сынағы бар.','AT-14','#13/#14; demo security gate'),
('FR-15','M','Тіркелу, email растау және парольді қалпына келтіру','Жарамды name/email/password арқылы role=user аккаунты құрылады; duplicate email қабылданбайды; SMTP хатымен бір реттік/мерзімі бар растау және reset ағымы өтеді; verify/reset токені access ретінде қолданылмайды.','AT-15','#1/#2; production SMTP жеке тексеріледі'),
('FR-16','M','Атауды өзгерту','Пайдаланушы тек өз атауын 2–100 таңбаға өзгертеді, бос шеттері алынады; база және қайта жүктелген UI сәйкес; id/role/email/password body өрістері құқықты өзгерте алмайды. Email ауыстыру бұл талапқа кірмейді.','AT-16','#4; PUT /auth/me'),
('FR-17','M','Контентті әкімші арқылы басқару','Әкімші course/lesson/test құрып және өңдейді; атау/тіл жұбы/байланыстар тексеріледі; student және anonymous жаза алмайды; тарихы бар контентті жою нәтижені бүлдірмейтін архивтеу не келісілген шектеумен орындалады.','AT-17','admin courses/lessons/tests; schema сәйкестігі тексеріледі'),
('FR-18','M','Хабарландыру және жетістіктер','Пайдаланушы өз хабарламасын оқиды және оқылды деп белгілейді; оқу оқиғасына байланысқан хабарлама/XP бір рет есептеледі; студент өзіне негізсіз XP немесе өзгеге хабарлама қоса алмайды.','AT-18','#9/#10; notifications/achievements'),
('FR-19','M','Кері байланыс','Тақырып, email және мәтін валидациясынан өткен өтініш сақталады; пайдаланушыға тіркелгені көрсетіледі; өтініштер тізімі/күйі тек уәкілетті әкімшіге ашық; rate limit және spam бақылауы бар.','AT-19','feedback routes'),
('FR-20','O','Сыртқы ЖИ тіл практикасы','Тек жеке scope/security approval-дан кейін: түсіндірілген opt-in, контекстті азайту, жеке дерек сүзгісі, рұқсатсыз сыртқы шақыруға тыйым, timeout/fallback, шағым арнасы; ЖИ ресми баға қоюдың жалғыз негізі емес.','AT-20','#14 SEC-03; Groq optional'),
]
NFR=[
('NFR-01','D','Стек және қайталанатын орнату','React/Vite frontend, Node.js/Express API, PostgreSQL 16. CI/Docker базасы Node.js 22; setup-та қолданылған Node.js 24 қосымша орта ретінде бөлек тексеріледі. npm ci lockfile-мен өтеді; README қадамымен таза ортада health және негізгі сценарий іске қосылады.','AT-21'),
('NFR-02','D','Тіл және UI','Негізгі демо сценарийлерінің мәзірі/қате/сәтті хабарламасы қазақша; loading/empty/error/success күйлері ажырайды; пернетақтамен формаға жетіп жіберуге болады; міндетті өрістердің label-ы бар.','AT-22'),
('NFR-03','D','Демо платформасы','Chrome stable desktop, 1280×720 және 1440×900; браузер/ОЖ нұсқасы хаттамаға жазылады. Mobile 360×800 және өзге браузерлер M-де жеке тексеріледі; D қабылдау матрицасына автомат кірмейді.','AT-22'),
('NFR-04','D','Қолжетімділік және құпиялар','Пароль bcrypt cost≥10 хэшімен; JWT қолтаңба/мерзім/purpose тексеруі; server-side рөл/ownership; параметрленген SQL. Пароль, JWT, API key лог/репозиторий/клиент жауабына шықпайды. Қате жауап SQL/stack ашпайды.','AT-23'),
('NFR-05','D','Дерек тұтастығы','FK және unique шектеулері сақталады; бір пайдаланушы/сабақ прогресі жалғыз; attempt submit транзакциялық және параллель шақыруда бір нәтижелі; синтетикалық миграцияда row count/FK салыстырылады.','AT-24'),
('NFR-06','D','Backup/restore демонстрациясы','Бір келісілген synthetic snapshot алынып, бастапқы БД-дан бөлек оқшау БД-ға қалпына келтіріледі; негізгі кесте сандары/FK және кіру→сабақ→нәтиже сценарийі тексеріледі; негізгі БД үстінен restore жасалмайды.','AT-25'),
('NFR-07','D','Тексеру және релиз','Frontend build, backend syntax және PostgreSQL-пен бар API smoke тексерулері өтеді; жаңа сценарийлер үшін тиісті acceptance сынақтары қосылады. Peer review, стенд демосы, белгілі ақаулар және release commit тіркеледі; smoke жалғыз өзі толық қабылдау емес.','AT-26'),
('NFR-08','M','Пилот өнімділігі','Бастапқы жоспар: 1 000 MAU/ай, 8 000 progress операциясы/ай — жорамал. 20 виртуалды пайдаланушы, 15 минуттық synthetic workload, әр сценарийде ≥1 000 eligible әрекет: login ≥99,5% ≤2с; lesson ≥99% ≤3с; progress ≥99,5% ≤2с. Өлшем click→UI растауы, progress үшін read-back-пен. Бұл ресурс көтеретіні өлшенген жоқ.','AT-27'),
('NFR-09','M','Қолжетімділік және error budget','Пилот window Mon–Sat 08–20 Asia/Qyzylorda; нақты айдың күнтізбесі алынады. Ішкі availability SLO 99,5%, сыртқы SLA жобасы 99%. 312 сағаттық үлгіде бюджет 93,6/187,2 минут; request budget бөлек. 50%-да тәуекелді релиз шектеу, 100%-да feature freeze. Оператор бекіткенге дейін SLA күшіне енбейді.','AT-28'),
('NFR-10','M','Дербес дерек және тасымалдау','Нақты дерек пилотына дейін заңды негіз/келісім қажеттілігі, дерек тізілімі, сақтау/жою мерзімі, рөлдер және оператор бекітіледі. Жобалық шарт ретінде primary/backup/PII логтары ҚР аумағында расталады; сыртқы SMTP/ЖИ трансшекаралық өңдеуі бөлек тексеріледі; HTTPS міндетті.','AT-29'),
('NFR-11','M','Пилоттың резервтік көшіруі','Күн сайын encrypted backup, бөлек storage және бөлек шектелген қолжетімділік; ұсынылған retention 7 күн, жауапты тұлға бекітеді. RPO≤24сағ, RTO≤8сағ — restore жаттығуымен расталатын инженерлік мақсат; ай сайын restore сынағы. 24/7 кезекшілік бөлек қаржыланбайынша уәде етілмейді.','AT-30'),
('NFR-12','M','Мониторинг және аудит','Health БД дайын болмаса 503, дайын болса 200; journey ID/time/status/latency және әкімші өзгерістерінің actor/action/object/outcome метрикалары сақталады; PII/құпиялар редакцияланады. Тәуліктік дерек толықтығы және айлық SLO есебі бар; көлем/retention оператор бекітеді.','AT-31'),
]

doc='''# ADENLY — ТЕХНИКАЛЫҚ ТАПСЫРМА

**Тіл үйренуге арналған веб-платформаны дамыту және қабылдау**

Құжат коды: ADENLY-TZ-01. Нұсқа: 1.0. Күні: 05.11.2026. Тілі: қазақша. Күйі: келісуге арналған жоба.

| Бекіту өрісі | Мәні |
|---|---|
| Тапсырыс беруші ұйым | [Ұйым атауы толтырылады] |
| Өкілетті қабылдаушы | [Аты-жөні, лауазымы және өкілеттігі толтырылады] |
| Орындаушы | Adenly оқу командасы |
| Оқу бағалаушысы | Некесова А.А.; өнімнің тапсырыс берушісі немесе спонсоры автоматты түрде саналмайды |
| Бекіту | [Күні / қолы / келісілген нұсқа] |

## 1. Жалпы мәлімет және әзірлеу негізі

Adenly — студентке тіл курсын таңдауға, сабақ оқуға, тапсырма орындауға, оқу прогресін сақтауға және келісілген тест нәтижесі бойынша базалық сертификат алуға арналған веб-платформа. Жұмыс қолданыстағы React/Vite, Express және PostgreSQL кодына сүйенеді; жүйе нөлден қайта жазылмайды.

ТЗ өнімнің қандай нәтиже беруін, қандай шектеулерде жұмыс істеуін және оны қалай қабылдауды анықтайды. SoW жұмыс шекарасы мен тарап міндеттемесін, ЛЗ 5 мерзім/ресурсты, ЛЗ 7 қауіптерді, ЛЗ 8 эксплуатацияны, ЛЗ 9 ағынды басқару тәсілін толықтырады. Қайшылық болса scope/мерзім үнсіз өзгермейді: CR рәсімімен baseline жаңартылады.

Негізгі құжаттар: [релиз жоспары](../plan/releases-lz5.md), [capacity](../plan/capacity-lz5.md), [SoW](../lz8/01_SoW.md), [SLO/SLA](../lz8/02_SLO_SLA.md), [қауіпсіздік backlog](../security/backlog.md), [нақты жұмыс тізімі](../plan/real-backlog.md). Репозиторий: https://github.com/Arnurzhairbek/Adenly .

| Қатысушы | Рөлі / осы ТЗ-дағы жауапкершілігі |
|---|---|
| Жайрбек Арнұр | Project Manager — baseline, басымдық, CR және тапсыру үйлестіруі |
| Байғұл Шыңғыс | Business / System Analyst — талап, контент шекарасы, қабылдау критерийі |
| Есеркенов Абдулазиз | Technical Lead / Developer — архитектура, код, БД және техникалық қауіптер |
| Әшімбай Қайсар | Data / QA Analyst — тест, дерек тұтастығы, метрика және қабылдау дәлелі |

Ішкі рөл ресми тапсырыс беруші атынан қол қою құқығын бермейді. Ұйым, оператор және спонсор әлі жеке бекітіледі.

## 2. Мақсат, өлшенетін нәтиже және пайдаланушылар

Мақсат — келісілген тіл жұбы бойынша оқу контентіне бірізді қолжетімділік пен студенттің сақталатын оқу нәтижесін қамтамасыз ету. Қабылданатын негізгі тізбек: synthetic студент кіреді → бір курс пен сабақты ашады → аяқталуын сақтайды → бір тестті өтеді → нәтижесін қайта көреді → шарт орындалса сертификат алады.

Табыс өлшемі: осы тізбектің барлық D acceptance критерийі өтуі, бөтен дерекке қолжетімділік болмауы, жарамсыз submit нәтижені бүлдірмеуі, reload және оқшау restore кезінде дерек сақталуы. Бұл оқу үлгерімі пайызға өсті деген ғылыми/педагогикалық дәлел емес; оқу тиімділігі бөлек зерттеледі.

| Рөл | Рұқсат етілген әрекет | Шектеу |
|---|---|---|
| Қонақ | Ашық каталог/сабақтың жария мазмұнын көру, M-де тіркелу | Жеке прогресс/attempt/сертификат пен admin API ашылмайды |
| Студент (`user`) | Өз профилі, сабақ, өз прогресі/талпынысы/сертификаты | Өзге студент дерегі, контентті өңдеу, еркін XP/роль өзгерту жоқ |
| Әкімші (`admin`) | M-де контент пен рұқсат етілген басқару әрекеттері | Рөл серверде тексеріледі; қажетсіз жеке дерекке автоматты толық құқық берілмейді |
| Оператор | Deploy, backup/restore, мониторинг, инцидент | Инфрақұрылым рөлі; өнімдегі admin рөлімен бір нәрсе емес, қолжетімділігі бөлек бекітіледі |

## 3. Кезеңдер және жұмыс шекарасы

Белгілер: **D** — 10.12.2026 дейінгі жабық демоға міндетті; **M** — кейінгі толық MVP/нақты дерек пилоты, мерзімі бөлек бекітіледі; **O** — қосымша мүмкіндік, бөлек CR/қаржымен ғана. D талаптары M-де де сақталады. Мәртебе орындалғандықты емес, көлемнің басымдығын көрсетеді.

| Кезең | Қамту | Мерзім/ресурс |
|---|---|---|
| D — мерзімдік жабық демо | Synthetic дерек, бір тіл жұбы/курс, ≥1 сабақ, бір single-choice тест, профильді көру, негізгі progress/result/certificate, қауіпсіздік gate, restore және тапсыру | Бұрын келісілген 10.12.2026; ұсынылған қалған еңбек 54 адам-сағат. Бұл бағаны Tech Lead әлі нақтылауы керек |
| M — толық MVP және пилот | D + нақты email lifecycle, атауды өңдеу, admin контенті, notifications/жетістік, feedback, mobile acceptance және эксплуатациялық бақылау | ЛЗ 5-тегі 132 сағаттық MVP бағасы — бөлек жоспар; оны 10.12-ге автомат міндеттемейміз. Жаңа бағалау/күн/оператор бекітіледі |
| O — кеңейту | Сыртқы Groq ЖИ, кең геймификация, көп курс/тіл, жаңа интеграциялар | Осы ТЗ-ның D/M мерзімдік міндеттемесіне кірмейді |

Төлем, жазылым, мобильді native қолданба, LMS/университет жүйесімен интеграция және ресми танылатын білім сертификатын беру осы көлемге кірмейді. Upload қауіпсіздігі толық аяқталмаса D-де endpoint өшіріледі; бұл production түзетуінің орнына жүрмейді. D-де email растау CI-дегі тест тәсілімен орындалуы мүмкін, нақты SMTP жеткізуі M-де тексеріледі.

30.10.2026-де атауды сақтау коды қосылғаны оны D көлеміне автомат енгізбейді; FR-16 M талабымен бөлек қабылданады. Қолданыстағы code/route болуы acceptance өтті деген сөз емес.

## 4. Пайдаланушылық сценарийлер

| Сценарий | Алғышарт және қадамдар | Сәтті нәтиже және балама |
|---|---|---|
| UC-01 Кіру | Расталған synthetic аккаунт; email/пароль → login | Өз кабинеті; қате парольде access жоқ, түсінікті қате; мерзімі өткен токенмен қайта кіру |
| UC-02 Сабақты оқу | Курс → сол курс сабақтары → бір сабақ | Дұрыс мазмұн; бос курс/жоқ сабақ/сервер қатесі бөлек көрсетіледі |
| UC-03 Прогресті сақтау | Авторизацияланған студент → «аяқталды» → reload | Бір user/lesson жазбасы, өзінің нәтижесі; бөтен user_id әсер етпейді |
| UC-04 Тест және нәтиже | Белсенді тест/қалған әрекет → бастау → жауаптар → submit → reload | Дұрыс score/attempt; бөтен/қайталанған жауап пен лимит бұзылуы қабылданбайды; ішінара сертификат жоқ |
| UC-05 Сертификат | Шартқа сай өткен өз attempt → PDF | Аты/курс/күн/бірегей нөмір дұрыс; өтпеген/бөтен нәтиже үшін берілмейді |
| UC-06 Контент басқару (M) | Уәкілетті admin → course/lesson/test өңдеу | Өзгеріс сақталады, FK/тарих сақталады; student/anonymous әрекеті 401/403 |

## 5. Функционалдық талаптар

Әр талаптың толық өлшемі және сынақ ID-і төменде. Барлық жаңа сандық баға/мінез-құлық — бекітуге арналған нысаналы талап, өлшенген дайын нәтиже емес.

| ID | Кезең | Талап және қабылдау критерийі | Сынақ |
|---|---|---|---|
'''
for id,stage,title,criterion,test,ref in FR:doc+=f'| {id} | {stage} | **{title}.** {criterion} | {test} |\n'
doc+='''
## 6. Бизнес ережелері және деректер моделі

Пароль мен email қатынасы: тіркелу public body-ден `admin` тағайындамайды; email растауы дербес дерекке заңды келісімнің дәлелі емес. Email ауыстыру FR-16 құрамына кірмейді; өзгерту қажет болса қайта растау/сессия саясаты CR-да анықталады.

Прогресс: `(user_id, lesson_id)` unique. Course сабақтан анықталады; клиент жіберген бөтен course_id қабылданбайды. Курс пайызы = аяқталған distinct сабақ саны / сол курсқа кіретін сабақ саны ×100; сабақ саны 0 болса 0% және бос курс күйі. Курстан тыс сабақ denominator-ға кірмейді. Бұл формула M UI-де және backend-де бірдей бекітіледі; бұрынғы кодтың формуласы автомат дұрыс деп саналмайды.

Тест: D-де single-choice, мысал шегі 70%, max_attempts=3; нақты test конфигурациясы басым. Үш бірдей баллдық сұрақта 3 дұрыс →100/pass, 2 дұрыс →67/fail. Start сәті және уақыт лимиті сервермен бекітіледі; client time_taken ақиқат көзі емес. Time limit NULL болса мерзім шегі жоқ; нөл/теріс конфигурация жарияланбайды. Start операциясы attempt санын басқару және параллель submit протоколымен бірге жобаланады. Бір logical attempt-ке бір нәтиже ғана; transaction rollback барлық ішінара response/score/certificate өзгерісін жояды.

Сертификат — оқу платформасының базалық нәтижелік құжаты, мемлекеттік/кәсіби квалификацияны автомат растамайды. Үшінші тарап кітапханасы мен контент құқықтары сақталады; курс материалын берген тарап пайдалану құқығын растайды.

| Логикалық объект / БД кестесі | Негізгі ақпарат | Тұтастық ережесі |
|---|---|---|
| users | id, name, email, password hash, role, verified, settings | Email unique; пароль хэші ғана; M профилі тек өз id-і |
| courses → lessons | Атау/сипаттама, language_from/to; сабақ мәтіні/медиа сілтемесі | Lesson.course_id FK; бос/жоқ күйі ажырайды |
| progress | user, course, lesson, completed, updated_at | User/lesson unique; course сабақпен үйлеседі |
| tests → test_questions → test_answers | Шек, әрекет/уақыт лимиті, сұрақ/нұсқа/балл | Жауап сұраққа, сұрақ тестке тиесілі; correct flag клиентке берілмейді |
| test_attempts → test_responses | User/test, басталу/аяқталу, score/passed, жауаптар | Ownership, logical attempt idempotency, server time, transaction |
| certificates | Нөмір, user/course/test, дата/metadata | Нөмір unique; қай нәтижеге тиесілігі және дубликаттан қорғаныс анық болуы керек |
| notifications / achievements / feedback | Оқу оқиғасы, хабарлама күйі, XP, өтініш | Ownership/уәкілетті admin; қайталау XP арттырмайды |

Физикалық схема `db/init.sql` және migration-дармен нұсқаланады. Қажетті idempotency/attempt байланысы немесе admin өрісі қазіргі схемада жоқ болса, сол өзгеріс migration және тестпен бөлек енгізіледі; ТЗ оны іске асқан деп жарияламайды. Enrollment/ақылы жазылым жеке кестесі қазіргі baseline-да жоқ және талап етілмейді.

| Енгізу өрісі | Нысаналы валидация |
|---|---|
| Name | M тіркелу/өңдеу кезінде trim, 2–100 таңба; басқа тип/бос мән қабылданбайды |
| Email | M-де жарамды пішім, ≤100 таңба, server normalization және unique; ownership lifecycle қайта растаумен қорғалады |
| Пароль | M-де ≥8 таңба, bcrypt үшін UTF-8 ұзындығы ≤72 байт; silent truncation жоқ. Бұл мақсат қолданыстағы қысқарақ минимумды күшейтуі мүмкін және FR-15 сынағында тексеріледі |
| ID және байланыс | Positive integer, PostgreSQL integer шегінде; нысан бар және тиісті owner/parent-ке тиесілі |
| Курс/сабақ атауы | M admin: course 1–200, lesson 1–255 таңба, trim; бос атау жоқ |
| Feedback | M-де subject 1–200, message 1–2 000 таңба, email пішімі; осы шектерді асыратын input 400 |

## 7. Функционалдық емес талаптар

| ID | Кезең | Талап және өлшем | Сынақ |
|---|---|---|---|
'''
for id,stage,title,criterion,test in NFR:doc+=f'| {id} | {stage} | **{title}.** {criterion} | {test} |\n'
doc+='''
Pilot performance сынағында latency ≥1 000 оқиғадан тікелей есептеледі: жақсы оқиға функциясы дұрыс және көрсетілген уақыттан аспайды. Жарамды сұраудағы timeout/5xx/қызметтің 429 жауабы сәтсіздікке кіреді. Қате пароль сияқты алдын ала келісілген теріс сценарийлер жеке есептеледі; белгісіз қате үнсіз алып тасталмайды. Айлық SLO-ны қысқа load test толық дәлелдемейді; екеуінің дәлелі бөлек сақталады.

Нақты құқықтық редакция/ұйым саясаты бұл ТЗ жазу кезінде ресми расталған жоқ. NFR-10 — жобалық gate; Қазақстанда primary сақталуы сыртқы ЖИ/SMTP-ге дерек беруді автомат заңды етпейді. Дерек сақтау/жою мерзімдері және кәмелетке толмағандарға қатысты шарттар бекітілмей нақты студенттер пилоты ашылмайды.

## 8. Архитектура және интерфейстер

Browser UI → HTTPS reverse proxy → Express REST API → PostgreSQL. Жабық әзірлеуде localhost HTTP қолданылуы мүмкін; нақты дерек пилотында HTTPS міндетті. Фронтенд БД-ға тікелей қосылмайды. PostgreSQL сыртқы желіге жария ашылмайды; web/API және data рұқсаттары ажыратылады. Сыртқы SMTP/Groq D-де міндетті емес.

JSON API `/api` префиксімен; protected route-тар `Authorization: Bearer <access token>` қолданады. Қате жауапта пайдаланушыға түсінікті message және тиісті HTTP status; production SQL/stack/құпиясыз. Құпия нақты token мысалы құжатқа қосылмайды.

| Интерфейс | Мақсат | Мәртебе / шектеу |
|---|---|---|
| POST /api/auth/register, POST /api/auth/login | Тіркелу және access сессиясы | Кодта бар; нақты SMTP M acceptance-ті талап етеді |
| GET /api/auth/me, PUT /api/auth/me | Өз профилін алу, M-де атауын өзгерту | Атауды сақтау коды 30.10 қосылды; peer/browser қабылдауы бөлек |
| GET /api/courses, GET /api/courses/:id | Курс тізімі және карточкасы | Бар; UI edge-case тексеріледі |
| GET /api/courses/:courseId/lessons | Курс сабақтарының негізгі URL-і | 30.10 қосылды; бұрынғы GET /api/lessons/course/:courseId қолдауы сақталған |
| GET /api/lessons/:id | Сабақ мазмұны | Бар; HTML қауіпсіздігі бөлек тексеріледі |
| POST /api/progress, GET /api/progress/user/:user_id | Өз прогресін сақтау/оқу | Бар; pagination жауап келісімшарты UI-мен салыстырылады |
| GET /api/tests/course/:courseId, GET /api/tests/:testId/start | Тест тізімі және сұрақтарын алу | Бар. FR-08/09 үшін серверлік start/attempt тіркеуі жетілдіріледі; жаңа POST start/attempt contract қажет болса CR-да бекітіледі |
| POST /api/tests/:testId/submit | Жауапты бағалап сақтау | Бар, бірақ SEC-01 толық түзетуі/теріс тесттері әлі қабылданбаған |
| GET /api/tests/attempts/:attemptId | Өз нәтижесін алу | Бар; ownership acceptance міндетті |
| GET /api/certificates/my, GET /api/certificates/:certificateId/download | Өз сертификатын көру/PDF | Бар; issuance/idempotency/ownership толық acceptance қажет |
| POST/PUT/DELETE /api/courses және /api/lessons | M контент басқаруы | Барлық операция схема/роль/тарих талаптарына сәйкестендіріледі; upload D-де ажыратылады |
| GET /health | Readiness | БД дайын болмаса 503, дайын болса 200; frontend root HTML беруі де тексеріледі |

HTTP келісімі: сәтті оқу 200; ресурс жасалғанда 201; қате дерек 400; аутентификация жоқ/токен жарамсыз 401; құқық жоқ 403; табылмады 404; қайталанған/қайшылықты submit 409 немесе baseline-мен келісілген 4xx; rate limit 429; ішкі қате 500. Тест error code-ты өзгерту қажет болса backward compatibility әсері бекітіледі. Бөтен ресурстың бар-жоғын жауаппен ашпау саясаты келісілген 403/404 арқылы сақталады.

## 9. Орта, тәуелділік және орналастыру

Репозиторий құрамдары: `lang-frontend`, `lang-backend`, PostgreSQL; Docker Compose конфигурациясы бар. Frontend dev port 5173, backend 5000; Compose PostgreSQL host port 5433, container port 5432. Порттар — әзірлеу baseline-ы; public deployment-та reverse proxy/TLS және firewall оператор арқылы қойылады.

Қажет параметрлер: DB_HOST/PORT/NAME/USER/PASS, JWT_SECRET, NODE_ENV, ALLOWED_ORIGINS, FRONTEND_URL, frontend VITE_API_URL. M SMTP үшін EMAIL_HOST/PORT/USER/PASS; O ЖИ үшін GROQ_API_KEY. Нақты мәндер Git-те сақталмайды. Демо үшін synthetic БД/кілттер бөлек, production credential қолданылмайды.

Бастапқы пилот ресурс жорамалы — 2 vCPU/4 GiB RAM/80 GiB SSD және бөлек backup, ЛЗ 8 бюджетімен тексеріледі. Бұл конфигурация NFR-08 жүктемесін көтеретіні әлі өлшенбеген. Баға/провайдер/физикалық орын расталғанша сатып алу шешімі бекітілген болып саналмайды. Үш орналастыру нұсқасы мен 12 айлық шығын ТЗ бағасы емес, [ЛЗ 8 моделінде](../lz8/04_Ornalastyru.md) жеке берілген.

## 10. Кезеңдер, мерзім және өзгерістер

| Веха | Baseline күні | Қабылданатын нәтиже |
|---|---|---|
| I1 — тіркелгі және оқу негізі | 01.11.2026 | Кіру, курс/сабақ, профильді оқу. Күн өткен, бірақ осы ТЗ оны орындалды деп растамайды; нақты күй evidence-пен жаңартылады |
| I2 — тест, прогресс және қорғаныс | 22.11.2026 | Бір тест/нәтиже/сертификат, ownership, SEC gate және теріс сценарийлер |
| Release candidate | 07.12.2026 | Қайталанатын стенд, толық D acceptance пакетіне ұсыну |
| I3 — тапсыру | 10.12.2026 | Оқшау restore, миграция салыстыруы, оқыту, runbook және акт |

Жалпы бұрынғы ресурс: 4×6 сағат/апта×8 апта=192; қолжетімсіздік жорамалы 32; тәуекел резерві 102; жұмыс capacity 58; демо 54; бос 4. Бұл 05.11 күнінен кейінгі қалдық capacity емес: өткен нақты еңбек пен қалған сағатты PM бөлек қайта есептейді. Демоның 54 сағат бағасы орындалатыны қайта бағаланып, scope/date қорғалуы керек.

CR механикасы: сұрау ID/себеп → Analyst критерийі → Tech Lead+QA еңбек/тәуелділік/қауіп бағасы → PM baseline әсері → өкілетті тапсырыс беруші шешімі → нұсқа/журнал жаңарту. 10.12 мерзімі бекітілсе, жаңа жұмыс салыстырмалы көлемдегі міндетті емес жұмыстың орнына ғана кіреді. Қауіпсіздік, дерек тұтастығы, restore және тапсыру алынбайды. Мақұлданғанға дейін жаңа scope басталмайды; резерв автомат функцияға айналмайды.

## 11. Сынақ және қабылдау тәртібі

Барлық D талабы D қабылдауына дейін өтуі тиіс. M/O сынағы D нәтижесін бұзбаса, оның орындалмауы демоны толық MVP ретінде көрсетуге рұқсат бермейді; M/O бөлек кезеңде қабылданады. P1 — дерек жоғалуы/рұқсатсыз қолжетімділік/негізгі тізбек тоқтауы; P2 — негізгі әрекет келісілген workaround-сыз орындалмайды. Ашық P1/P2-мен тиісті кезең қабылданбайды.

Демо қабылдау деректері: кемінде 2 synthetic студент және 1 admin, бір course/≥1 lesson/бір test ≥3 сұрақ; дұрыс/қате/бөтен/қайталанған input жиындары. Функционалдық тестте күтілетін жауап кілті алдын ала QA-да болады, клиентке берілмейді. Browser acceptance-де әр негізгі UC кемінде бір рет жаңа сессияда және reload-пен өтеді. Бұл NFR-08 load test-тің орнына жүрмейді.

Сынақ түрлері: API positive/negative және DB verification; браузер интеграциялық сценарий; role/ownership/security; parallel submit және transaction rollback; backup/restore; M үшін load/SLI және SMTP. Нақты test case матрицасы acceptance_tests.csv файлында. Әр жолдың бастапқы күйі Not run: құжаттың дайын болуы сынақтың өткенін білдірмейді.

Қабылдау дәлелі: release commit, орта/браузер нұсқасы, test ID, уақыт, орындаушы, күтілетін/нақты нәтиже, pass/fail/unrun, жеке дерексіз лог/скриншот және ақау сілтемесі. Орындаушы пакетті ұсынады; өкілетті тапсырыс беруші 3 жұмыс күнінде қарайды, дәлелді бас тартса критерий/қадам/маңыздылықты көрсетеді. Түзетілген пакет 2 жұмыс күнінде қайта қаралады. Үндемеу қабылдау емес. Оқу бағасы өнімнің ұйым атынан қабылдау актісін алмастырмайды.

Қазіргі дәлел snapshot: 30.10.2026 сессиясында PostgreSQL-пен 39 API smoke, 48 backend файл syntax және frontend build өткен. Бұл тарихи тексеру; 05.11.2026 күні толық қайталанған жоқ. Browser, SEC-01 submit, сертификат және restore acceptance осы санмен жабылмайды. ЛЗ 9 CSV/CFD — белгіленген оқу симуляциясы, actual implementation evidence емес.

## 12. Тапсырылатын материалдар және ашық шешімдер

| Нәтиже | Құрамы |
|---|---|
| Код және нұсқа | Репозиторий, release commit/tag; dependency lockfile және лицензия тізімі |
| Қайталанатын орта | Орнату/іске қосу, құпиясыз env үлгісі, migration/seed және health тексеруі |
| Қабылдау пакеті | requirements.csv, acceptance_tests.csv, нақты тест хаттамалары, ақау/шектеу тізімі |
| Пайдаланушы нұсқаулығы | Кіру, оқу, прогресс, тест/нәтиже, сертификат; қате болғанда әрекет |
| Оператор runbook | Deploy/rollback, backup/restore, қолжетімділік/құпия басқару және инцидент байланысы |
| Тапсыру | Қысқа оқыту/кері байланыс, файл/құқық беру және акт; қолдау бөлек келісіммен |

Бекітілетін ашық шешімдер: тапсырыс беруші/қабылдаушы/оператор; курс/тіл жұбы мен контент құқығы; демо 54 сағаттың қалған бағасы; M мерзімі/қаржысы; заңды негіз/сақтау саясаты; нақты hosting/backup елі; test start/idempotency migration келісімшарты; SMTP/ЖИ провайдері қажет болса шарты; production SLO өлшемі және SLA иесі.

Өнімді тапсырғаннан кейінгі тұрақты қолдау, жаңа функциялар және барлық ақаудың болмауына абсолют кепіл осы ТЗ-ға автомат кірмейді. Қабылдауда келісілген критерийді бұзған ақау жаңа функция деп саналмайды. Нәтижеге құқық пен үшінші тарап лицензиялары [SoW](../lz8/01_SoW.md) және тараптар бекіткен қосымшада анықталады.

## Қосымша A. Терминдер және талаптарды қадағалау

FR — функционалдық талап; NFR — функционалдық емес талап; AT — қабылдау сынағы; D/M/O — кезең белгілері; MVP — ең аз өміршең өнім; SLI — өлшем, SLO — ішкі мақсат, SLA — сыртқы келісілген міндеттеме; RPO — жоғалуы рұқсат дерек аралығы; RTO — қалпына келтіру мақсаты; CR — өзгеріс сұрауы.

Талап → UC/модуль → AT → release evidence байланысы CSV матрицада жүргізіледі. ID тұрақты сақталады; өшірілген талап қайта нөмірленбейді, CR арқылы superseded күйі беріледі. Сандық мақсат немесе M/O scope өзгерсе, 1.0 baseline бекітілуіне дейін өзгерістер журналына енгізіледі.

| Нұсқа | Күні | Өзгеріс | Күй |
|---|---|---|---|
| 1.0 | 05.11.2026 | Қолданыстағы талап/код, SoW және жоспар негізіндегі бірінші толық ТЗ | Бекітуге ұсынылады; қол қойылған құжат емес |
'''

def write_sources():
    (ROOT/'Adenly_TZ_kk.md').write_text(doc,encoding='utf-8')
    rows=[];tests=[]
    steps={
      'AT-01':'Жаңа сессияда дұрыс дерекпен кіріңіз; қате парольмен, расталмаған аккаунтпен және expired token-мен қайталаңыз.',
      'AT-02':'A/B екі студент токенімен өз және бөтен progress/attempt сұрауын жасаңыз; admin жазуын student/anonymous ретінде шақырыңыз.',
      'AT-03':'GET /auth/me және профиль UI-ін салыстырыңыз; жауаптағы өрістерді тексеріп, басқа id body/query беріңіз.',
      'AT-04':'Толтырылған каталогты ашыңыз; оқшау тест БД-да бос каталог және басқарылатын API 500 жағдайын көрсетіңіз.',
      'AT-05':'Екі курс URL-ін салыстырыңыз; бос курс, жоқ course id және invalid id шақырыңыз; UI навигациясын тексеріңіз.',
      'AT-06':'Дұрыс сабақ, жоқ материал және synthetic HTML/script payload бар оқшау сабақ ашыңыз; код орындалмауын тексеріңіз.',
      'AT-07':'A токенімен lesson сақтаңыз, B user_id және бөтен course_id жіберіңіз; жарамды сұрауды қайталап, БД count және reload-ты салыстырыңыз.',
      'AT-08':'Белсенді тестті бастаңыз; server start timestamp пен қалған әрекетті тексеріңіз; JSON ішінде correct flag/кілт жоқтығын тексеріңіз.',
      'AT-09':'Бөтен question/answer, дубликат, толық емес жауап, inactive test, асып кеткен attempts/time сценарийлерін бөлек жіберіңіз; әр қате соңында БД partial writes жоқтығын тексеріңіз.',
      'AT-10':'3 бірдей баллдық сұраққа 3/3 және 2/3 дұрыс жауап беріңіз; бір logical attempt submit-ін қатар екі connection-нан жіберіңіз; мәжбүрлі transaction error кезінде rollback-ты тексеріңіз.',
      'AT-11':'Өз нәтижесін екі рет сұраңыз және бетті жаңартыңыз; басқа студент токенімен сол attempt-ті сұраңыз; attempt count өзгермегенін салыстырыңыз.',
      'AT-12':'Passed және failed synthetic attempts үшін PDF сұраңыз; own/foreign token және қайталанған issuance-ты тексеріңіз; нөмір мен БД жазба санын салыстырыңыз.',
      'AT-13':'Таза тест БД-ға seed орнатыңыз; course/lesson/question санын тексеріңіз; student токенімен admin CRUD сұраңыз; env үлгісінде құпия жоқтығын тексеріңіз.',
      'AT-14':'Demo config-пен upload және Groq route-тарын тікелей шақырыңыз; external mock/proxy журналымен сыртқа сұрау кетпегенін, файл жасалмағанын тексеріңіз.',
      'AT-15':'Жаңа/duplicate/invalid email, 7/8 таңба және 72/73 UTF-8 байт password шегін тексеріңіз; нақты тест mailbox арқылы verify/reset, expired/reused/purpose-mismatched token сценарийін өткізіңіз.',
      'AT-16':'Атауды 2 және 100 таңбаға өзгертіңіз, reload жасаңыз; 1/101 таңба, бос/number және body id/role/email инъекциясын тексеріңіз.',
      'AT-17':'Admin-пен course/lesson/test құрып өңдеңіз; бос/ұзын атау, бөтен FK және тарихы бар контентті жоюды тексеріңіз; student/anonymous-пен қайталаңыз.',
      'AT-18':'Оқу оқиғасын екі рет жіберіп XP/notification санын салыстырыңыз; өзінің read күйін өзгертіңіз; басқа ID мен өз бетімен add-xp сұрауын тексеріңіз.',
      'AT-19':'Жарамды feedback жіберіңіз; бос/200-ден ұзын subject, 2000-нан ұзын мәтін/invalid email және burst жіберіңіз; тізімді student/admin ретінде сұраңыз.',
      'AT-20':'Opt-in жоқта сыртқы шақыруды тексеріңіз; synthetic email/телефон, provider timeout және fallback сынағын орындаңыз; ресми бағалаудан оқшау екенін көрсетіңіз.',
      'AT-21':'Таза келісілген ортада frozen install/build/start орындаңыз; lockfile diff, Node/PostgreSQL нұсқасы, readiness және UC-01→03 нәтижесін жазыңыз.',
      'AT-22':'Chrome stable-де 1280×720/1440×900 негізгі UC орындаңыз; keyboard/tab/label және қазақша empty/loading/error/success күйлерін тексеріңіз; M-де 360×800 қосыңыз.',
      'AT-23':'Invalid/expired/wrong-purpose JWT, SQL payload және өзге рөлдерді тексеріңіз; password hash cost-ын, жауап/лог/репозиторийде құпия/stack жоқтығын қараңыз.',
      'AT-24':'FK/unique metadata мен row count-ты тексеріңіз; duplicate progress және parallel submit өткізіңіз; synthetic migration алдында/соңында FK/сандарды салыстырыңыз.',
      'AT-25':'Synthetic dump алыңыз; бөлек бос БД-ға restore жасаңыз; негізгі кесте сандары/FK және UC-01→05 салыстыруын хаттамаға енгізіңіз.',
      'AT-26':'Release commit үшін build/syntax/smoke runner exit status-ын сақтаңыз; peer review, browser demo, docs және ашық ақау тізімін release пакетпен салыстырыңыз.',
      'AT-27':'20 VU/15 минуттық келісілген mix іске қосыңыз; әр journey ≥1000 оқиға жиналғанын, good/eligible және click→UI уақытын read-back-пен есептеңіз; raw metrics сақтаңыз.',
      'AT-28':'Күнтізбедегі window-дан availability/request budget есептеңіз; 50%/100% жұмсалу мысалында release gate әрекетін тексеріңіз; operator/SLA бекітуін қараңыз.',
      'AT-29':'Жауапты тұлғамен құқықтық/дерек тізілімін қараңыз; primary/backup/log physical location дәлелін, HTTPS, deletion және сыртқы алушы шарттарын тексеріңіз.',
      'AT-30':'Daily backup job және retention-ды тексеріңіз; isolated restore-ды уақытпен өлшеңіз; соңғы recovery point пен RPO/RTO айырмасын жазыңыз.',
      'AT-31':'БД дайын емес кезде /health 503, дайын кезде 200 тексеріңіз; бір journey/admin әрекетін correlation арқылы табыңыз; PII redaction, дерек толықтығы және айлық есепті тексеріңіз.',
    }
    # NFR-02 and NFR-03 intentionally share the UI/browser test AT-22.
    for req in FR+NFR:
        if req[0].startswith('FR'):
            id,stage,title,criterion,test,ref=req
        else:id,stage,title,criterion,test=req;ref='ТЗ: нысаналы NFR; acceptance бөлек қажет'
        planned_week=str(TARGET_WEEK[id]) if id in TARGET_WEEK else '15-аптадан кейін, бөлек бекітіледі'
        rows.append(dict(requirement_id=id,stage=stage,title=title,acceptance_criterion=criterion,test_id=test,source_or_module=ref,status='Proposed',evidence='',planned_acceptance_week=planned_week,week10_implementation_evidence=CURRENT_EVIDENCE[id]))
        tests.append(dict(test_id=test,requirement_id=id,stage=stage,preconditions='Synthetic деректер және тиісті рөл/орта; ТЗ §11. M/O үшін кезең gate-і бекітілген.',procedure=steps[test],expected_result=criterion,status='Not run',actual_result='',evidence='',tester='',tested_at='',planned_week=planned_week))
    for name,records in [('requirements.csv',rows),('acceptance_tests.csv',tests)]:
        with (ROOT/name).open('w',encoding='utf-8-sig',newline='') as f:
            w=csv.DictWriter(f,fieldnames=list(records[0]),lineterminator='\n');w.writeheader();w.writerows(records)
    assert len({r['requirement_id'] for r in rows})==32
    assert len({r['test_id'] for r in tests})==31
    assert {r['test_id'] for r in rows}=={r['test_id'] for r in tests}
    return rows,tests

def render():
    from docx import Document
    from docx.shared import Cm,Pt
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn
    from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,Table,TableStyle,PageBreak
    from reportlab.lib import colors
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from xml.sax.saxutils import escape
    font=Path('/usr/share/fonts/truetype/dejavu')
    pdfmetrics.registerFont(TTFont('TZ',str(font/'DejaVuSans.ttf')))
    pdfmetrics.registerFont(TTFont('TZBold',str(font/'DejaVuSans-Bold.ttf')))
    pdfmetrics.registerFontFamily('TZ',normal='TZ',bold='TZBold',italic='TZ',boldItalic='TZBold')
    styles={
      'body':ParagraphStyle('body',fontName='TZ',fontSize=9.2,leading=13,spaceAfter=7,wordWrap='CJK'),
      'h1':ParagraphStyle('h1',fontName='TZBold',fontSize=17,leading=22,spaceAfter=13,keepWithNext=True,textColor=colors.HexColor('#153A50')),
      'h2':ParagraphStyle('h2',fontName='TZBold',fontSize=12,leading=16,spaceAfter=8,spaceBefore=10,keepWithNext=True,textColor=colors.HexColor('#153A50')),
      'cell':ParagraphStyle('cell',fontName='TZ',fontSize=7.5,leading=10.5,wordWrap='CJK'),
      'head':ParagraphStyle('head',fontName='TZBold',fontSize=7.5,leading=10.5,wordWrap='CJK',textColor=colors.white)}
    report=Document();sec=report.sections[0]
    sec.page_width=Cm(21);sec.page_height=Cm(29.7)
    sec.top_margin=Cm(1.7);sec.bottom_margin=Cm(1.7);sec.left_margin=Cm(1.7);sec.right_margin=Cm(1.7)
    report.styles['Normal'].font.name='DejaVu Sans';report.styles['Normal'].font.size=Pt(9)
    for heading,size in [('Title',23),('Heading 1',17),('Heading 2',12)]:report.styles[heading].font.name='DejaVu Sans';report.styles[heading].font.size=Pt(size)
    sec.header.paragraphs[0].text='ADENLY · ADENLY-TZ-01 · 1.1 · 05.11.2026'
    footer=sec.footer.paragraphs[0];footer.text='Бекітуге арналған жоба · '
    field=OxmlElement('w:fldSimple');field.set(qn('w:instr'),'PAGE');footer._p.append(field)
    cover=['ADENLY','ТЕХНИКАЛЫҚ ТАПСЫРМА','15 апталық жоба: қазір 10-апта, 14-апта RC, 15-апта қорғау','ADENLY-TZ-01 · Нұсқа 1.1 · 05.11.2026','Күйі: бекітуге арналған жоба','Жайрбек Арнұр — Project Manager','Байғұл Шыңғыс — Business / System Analyst','Есеркенов Абдулазиз — Technical Lead / Developer','Әшімбай Қайсар — Data / QA Analyst','Оқытушы: Некесова А.А.','Тапсырыс беруші және қабылдаушы: [толтырылады]']
    flow=[Spacer(1,65)]
    for i,line in enumerate(cover):
        if i<2:report.add_heading(line,0 if i==0 else 1)
        else:report.add_paragraph(line)
        flow.append(Paragraph(escape(line),styles['h1' if i<2 else 'body']))
        if i in [2,4]:flow.append(Spacer(1,15))
    report.add_page_break();flow.append(PageBreak())
    def clean(text):return re.sub(r'\[([^\]]+)\]\(([^)]+)\)',r'\1',text).replace('**','').replace('`','')
    lines=doc.splitlines();i=0
    while i<len(lines):
        line=lines[i].strip();i+=1
        if not line:continue
        if line.startswith('|'):
            raw=[line]
            while i<len(lines) and lines[i].strip().startswith('|'):raw.append(lines[i].strip());i+=1
            rows=[]
            for ll in raw:
                cells=[s.strip() for s in ll.strip('|').split('|')]
                if not all(re.fullmatch(r'[-: ]+',s) for s in cells):rows.append(cells)
            n=len(rows[0]);assert all(len(r)==n for r in rows)
            if rows[0][0]=='ID' and n==4:widths=[52,37,365,45]
            elif n==2:widths=[125,374]
            else:
                weights=[min(22,max(7,max(len(clean(r[c])) for r in rows)**.5*1.6)) for c in range(n)]
                widths=[499*w/sum(weights) for w in weights]
            table=report.add_table(rows=0,cols=n);table.style='Light Shading Accent 1';table.autofit=False
            for c,width in zip(table.columns,widths):c.width=Cm(width/28.346)
            for rowidx,row in enumerate(rows):
                cells=table.add_row().cells
                for c,text in enumerate(row):
                    cells[c].width=Cm(widths[c]/28.346);cells[c].text=clean(text)
                    for p in cells[c].paragraphs:
                        for run in p.runs:run.font.size=Pt(7.5);run.bold=rowidx==0
                if rowidx==0:
                    repeat=OxmlElement('w:tblHeader');table.rows[0]._tr.get_or_add_trPr().append(repeat)
            data=[[Paragraph(escape(clean(text)),styles['head' if r==0 else 'cell']) for text in row] for r,row in enumerate(rows)]
            pdf_table=Table(data,colWidths=widths,repeatRows=1,hAlign='LEFT')
            pdf_table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#153A50')),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#F0F5F7')]),('GRID',(0,0),(-1,-1),.35,colors.HexColor('#CEDAE0')),('VALIGN',(0,0),(-1,-1),'TOP'),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5)]))
            flow.extend([pdf_table,Spacer(1,9)]);report.add_paragraph('');continue
        if line.startswith('#'):
            level=len(line)-len(line.lstrip('#'));text=clean(line[level:].strip());report.add_heading(text,min(level,2));flow.append(Paragraph(escape(text),styles['h1' if level==1 else 'h2']))
        else:report.add_paragraph(clean(line));flow.append(Paragraph(escape(clean(line)),styles['body']))
    report.save(ROOT/'Adenly_TZ_kk.docx')
    def page(canvas,d):
        canvas.saveState();canvas.setFont('TZ',7);canvas.setFillColor(colors.HexColor('#456071'))
        canvas.drawString(48,817,'ADENLY · ADENLY-TZ-01 · 1.1 · 05.11.2026')
        canvas.drawString(48,26,'Бекітуге арналған жоба');canvas.drawRightString(547,26,str(d.page));canvas.restoreState()
    SimpleDocTemplate(str(ROOT/'Adenly_TZ_kk.pdf'),pagesize=(595.28,841.89),leftMargin=48,rightMargin=48,topMargin=46,bottomMargin=43,title='Adenly — техникалық тапсырма',author='Adenly командасы').build(flow,onFirstPage=page,onLaterPages=page)

def main():
    global doc
    doc=doc.replace('Нұсқа: 1.0.','Нұсқа: 1.1.')
    doc=re.sub(r'## 10\. Кезеңдер, мерзім және өзгерістер\n.*?(?=## 11\.)',lambda m:section_markdown()+'\n',doc,flags=re.S)
    doc+='| 1.1 | 05.11.2026 | Қазір 10-апта екенін ескеріп, академиялық 1–15 апталық actual/plan, 14-апта RC және 15-апта қабылдау енгізілді | Күндердің академиялық сәйкестігі ұсыныс; өткен факт дәлелмен ғана |\n'
    plan=write_plan()
    rows,tests=write_sources();render()
    head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
    validation=dict(document='ADENLY-TZ-01',version=VERSION,date=DATE,source_repository_head=head,
                    requirements=len(rows),functional=len(FR),nonfunctional=len(NFR),
                    unique_acceptance_scenarios=len({t['test_id'] for t in tests}),matrix_rows=len(tests),
                    stage_counts={s:sum(r['stage']==s for r in rows) for s in ['D','M','O']},
                    traceability='Every requirement has an acceptance test; AT-22 covers two UI/platform requirements',
                    all_requirement_ids_unique=True,all_acceptance_outcomes='Not run',
                    academic_weeks=len(plan),current_week=CURRENT_WEEK,release_candidate_week=14,final_acceptance_week=15,
                    calendar_mapping='Inferred Monday weeks from 2026-11-05 = week 10; subject to official academic calendar',
                    weekly_status_counts={s:sum(r['status']==s for r in plan) for s in ['Расталмаған','Ішінара','Ағымдағы','Жоспар']},
                    limitations=['Proposed specification; customer/operator approval pending','Full MVP not promised by 10.12.2026','Current implementation is not certified compliant by this document'])
    (ROOT/'validation.json').write_text(json.dumps(validation,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    targets=['README.md','Adenly_TZ_kk.md','Adenly_TZ_kk.docx','Adenly_TZ_kk.pdf','requirements.csv','acceptance_tests.csv','validation.json','build_tz.py','semester_plan.py','semester_plan.md','semester_plan.csv','Adenly_15_aptalyk_zhospar.xlsx','Adenly_Aptalyk_zhospar.docx','basic_weekly_plan.md','build_basic_plan.py']
    manifest={name:hashlib.sha256((ROOT/name).read_bytes()).hexdigest() for name in targets}
    (ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    with zipfile.ZipFile(ROOT/'Adenly_TZ_Paket.zip','w',zipfile.ZIP_DEFLATED) as z:
        for name in targets+['manifest.json']:z.write(ROOT/name,'Adenly-TZ/'+name)
    print(json.dumps(validation,ensure_ascii=False,indent=2))

if __name__=='__main__':
    main()
