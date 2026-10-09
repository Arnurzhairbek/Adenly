-- Скрипт для заполнения базы данных тестовыми курсами и уроками
-- Запустите этот скрипт для добавления контента на сайт

-- Проверяем и добавляем колонку language если её нет (для обратной совместимости)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'courses' AND column_name = 'language') THEN
    ALTER TABLE courses ADD COLUMN language VARCHAR(50);
  END IF;
END $$;

-- Очистка существующих данных (опционально, закомментируйте если нужно сохранить)
-- DELETE FROM lessons;
-- DELETE FROM courses;

-- ==========================================
-- КУРС 1: Бастауыштарға арналған ағылшын тілі
-- ==========================================
-- Вставляем курс только если его еще нет
DO $$
DECLARE
  course1_id INTEGER;
BEGIN
  -- Проверяем, есть ли уже курс
  SELECT id INTO course1_id FROM courses WHERE title = 'Бастауыштарға арналған ағылшын тілі';
  
  IF course1_id IS NULL THEN
    INSERT INTO courses (title, description, language_from, language_to, language) 
    VALUES (
      'Бастауыштарға арналған ағылшын тілі',
      'Бастапқы деңгейге арналған ағылшын тілі негіздері. Негізгі сөздерді, фразаларды және грамматиканы үйреніңіз.',
      'Қазақ',
      'Ағылшын',
      'Ағылшын'
    ) RETURNING id INTO course1_id;
  END IF;

  
  -- Уроки для курса "Бастауыштарға арналған ағылшын тілі" (только если их еще нет)
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE course_id = course1_id LIMIT 1) THEN
    INSERT INTO lessons (course_id, title, content) VALUES
  (course1_id, 'Сабақ 1: Сәлемдесу және танысу', 'Бұл сабақта сіз ағылшын тілінде қалай сәлемдесу және өзіңізді таныстыруды үйренесіз.

Негізгі фразалар:
- Hello! / Hi! - Сәлем!
- Good morning - Қайырлы таң
- Good afternoon - Қайырлы күн
- Good evening - Қайырлы кеш
- My name is... - Менің атым...
- Nice to meet you - Танысқаныма қуаныштымын
- How are you? - Қалыңыз қалай?
- I''m fine, thank you - Жақсы, рахмет

Практика:
Өзіңізді бірнеше тәсілмен таныстырып, әңгімелесушіге сәлемдесіңіз.'),
  
  (course1_id, 'Сабақ 2: Жеке есімдіктер және "to be" етістігі', 'Негізгі есімдіктерді үйреніп, қарапайым сөйлемдер құруды үйреніңіз.

Есімдіктер:
- I - мен
- You - сен/сіз
- He - ол (еркек)
- She - ол (әйел)
- It - ол (зат)
- We - біз
- They - олар

"to be" етістігі (болу):
- I am - мен болмын
- You are - сен/сіз боласың
- He/She/It is - ол болып тұр
- We are - біз болмыз
- They are - олар болып тұр

Мысалдар:
- I am a student - Мен студентпін
- You are a teacher - Сіз мұғалімсіз
- She is happy - Ол бақытты'),
  
  (course1_id, 'Сабақ 3: Түстер және сандар', 'Түстердің және 1-ден 20-ға дейінгі сандардың атауларын үйреніңіз.

Түстер:
- Red - қызыл
- Blue - көк
- Green - жасыл
- Yellow - сары
- Orange - қызғылт сары
- Purple - күлгін
- Black - қара
- White - ақ

Сандар 1-20:
- One, two, three, four, five
- Six, seven, eight, nine, ten
- Eleven, twelve, thirteen, fourteen, fifteen
- Sixteen, seventeen, eighteen, nineteen, twenty

Жаттығулар:
- Айналаңыздағы заттардың түстерін атаңыз
- 1-ден 20-ға дейін санаңыз'),
  
  (course1_id, 'Сабақ 4: Отбасы және туысқандар', 'Отбасын сипаттауға арналған сөздерді үйреніңіз.

Отбасы мүшелері:
- Family - отбасы
- Mother / Mom - ана
- Father / Dad - әке
- Brother - аға/іні
- Sister - апа/сіңлі
- Grandmother / Grandma - әже
- Grandfather / Grandpa - ата
- Son - ұл
- Daughter - қыз
- Uncle - аға/немере аға
- Aunt - апа/немере апа
- Cousin - немере туыс

Мысалдар:
- This is my mother - Бұл менің анам
- I have a brother - Менде аға/іні бар
- She is my sister - Ол менің апам/сіңлім'),
  
  (course1_id, 'Сабақ 5: Тағам және сусындар', 'Азық-түлік және сусындардың атауларын үйреніңіз.

Тағам:
- Bread - нан
- Milk - сүт
- Egg - жұмыртқа
- Apple - алма
- Banana - банан
- Chicken - тауық
- Fish - балық
- Rice - күріш
- Vegetables - көкөністер
- Fruits - жемістер

Сусындар:
- Water - су
- Coffee - кофе
- Tea - шай
- Juice - шырын
- Milk - сүт

Фразалар:
- I like... - Маған ұнайды...
- I don''t like... - Маған ұнамайды...
- I''m hungry - Мен аштық сезінемін
- I''m thirsty - Мен шөлдедім');
  END IF;
END $$;

-- ==========================================
-- КУРС 2: Бастауыштарға арналған испан тілі
-- ==========================================
DO $$
DECLARE
  course2_id INTEGER;
BEGIN
  SELECT id INTO course2_id FROM courses WHERE title = 'Бастауыштарға арналған испан тілі';
  
  IF course2_id IS NULL THEN
    INSERT INTO courses (title, description, language_from, language_to, language) 
    VALUES (
      'Бастауыштарға арналған испан тілі',
      'Испан тілін нөлден бастап үйреніңіз. Грамматика, лексика және сөйлеу негіздері.',
      'Қазақ',
      'Испан',
      'Испан'
    ) RETURNING id INTO course2_id;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE course_id = course2_id LIMIT 1) THEN
    INSERT INTO lessons (course_id, title, content) VALUES
  (course2_id, 'Сабақ 1: Негізгі сәлемдесулер', 'Испан тіліндегі негізгі сәлемдесулерді үйреніңіз.

Сәлемдесулер:
- ¡Hola! - Сәлем!
- Buenos días - Қайырлы таң
- Buenas tardes - Қайырлы күн
- Buenas noches - Қайырлы кеш
- Adiós - Сау болыңыз
- Hasta luego - Кейінірек кездесеміз
- ¿Cómo estás? - Қалыңыз қалай?
- Estoy bien - Жақсы
- Mucho gusto - Танысқаныма қуаныштымын'),
  
  (course2_id, 'Сабақ 2: Артикльдер және зат есімдердің тегі', 'Испан тілінде барлық зат есімдердің тегі бар.

Артикльдер:
- el (еркек тегі) - el libro (кітап)
- la (әйел тегі) - la mesa (үстел)
- los (еркек тегі, көпше) - los libros
- las (әйел тегі, көпше) - las mesas

Ережелер:
- -o-мен аяқталатын зат есімдер әдетте еркек тегі
- -a-мен аяқталатын зат есімдер әдетте әйел тегі
- Бірақ ерекшеліктер бар!'),
  
  (course2_id, 'Сабақ 3: 1-ден 100-ге дейінгі сандар', 'Испан сандарын үйреніңіз.

1-20:
Uno, dos, tres, cuatro, cinco, seis, siete, ocho, nueve, diez, once, doce, trece, catorce, quince, dieciséis, diecisiete, dieciocho, diecinueve, veinte

Ондықтар:
Veinte (20), treinta (30), cuarenta (40), cincuenta (50), sesenta (60), setenta (70), ochenta (80), noventa (90), cien (100)');
  END IF;
END $$;

-- ==========================================
-- КУРС 3: Бастауыштарға арналған неміс тілі
-- ==========================================
DO $$
DECLARE
  course3_id INTEGER;
BEGIN
  SELECT id INTO course3_id FROM courses WHERE title = 'Бастауыштарға арналған неміс тілі';
  
  IF course3_id IS NULL THEN
    INSERT INTO courses (title, description, language_from, language_to, language) 
    VALUES (
      'Бастауыштарға арналған неміс тілі',
      'Неміс тілін үйренуді бастаңыз. Айтылу, грамматика және лексика негіздері.',
      'Қазақ',
      'Неміс',
      'Неміс'
    ) RETURNING id INTO course3_id;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE course_id = course3_id LIMIT 1) THEN
    INSERT INTO lessons (course_id, title, content) VALUES
  (course3_id, 'Сабақ 1: Сәлемдесу', 'Неміс тіліндегі негізгі сәлемдесулер.

- Hallo! - Сәлем!
- Guten Morgen - Қайырлы таң
- Guten Tag - Қайырлы күн
- Guten Abend - Қайырлы кеш
- Gute Nacht - Қайырлы түн
- Tschüss - Сау болыңыз
- Wie geht''s? - Қалыңыз қалай?
- Gut - Жақсы'),
  
  (course3_id, 'Сабақ 2: Артикльдер der, die, das', 'Неміс тілінде зат есімдердің үш тегі бар.

- der (еркек тегі) - der Mann (ер адам)
- die (әйел тегі) - die Frau (әйел адам)
- das (орта тегі) - das Kind (бала)

Есіңізде болсын: зат есімдердің тегін сөзбен бірге үйрену керек!'),
  
  (course3_id, 'Сабақ 3: Сандар', 'Неміс сандары 1-20.

Eins (1), zwei (2), drei (3), vier (4), fünf (5), sechs (6), sieben (7), acht (8), neun (9), zehn (10), elf (11), zwölf (12), dreizehn (13), vierzehn (14), fünfzehn (15), sechzehn (16), siebzehn (17), achtzehn (18), neunzehn (19), zwanzig (20)');
  END IF;
END $$;

-- ==========================================
-- КУРС 4: Бастауыштарға арналған француз тілі
-- ==========================================
DO $$
DECLARE
  course4_id INTEGER;
BEGIN
  SELECT id INTO course4_id FROM courses WHERE title = 'Бастауыштарға арналған француз тілі';
  
  IF course4_id IS NULL THEN
    INSERT INTO courses (title, description, language_from, language_to, language) 
    VALUES (
      'Бастауыштарға арналған француз тілі',
      'Француз тілін нөлден бастап үйреніңіз. Әдемі айтылу және грамматика негіздері.',
      'Қазақ',
      'Француз',
      'Француз'
    ) RETURNING id INTO course4_id;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE course_id = course4_id LIMIT 1) THEN
    INSERT INTO lessons (course_id, title, content) VALUES
  (course4_id, 'Сабақ 1: Сәлемдесулер', 'Француз сәлемдесулері.

- Bonjour - Қайырлы күн / Сәлеметсіз бе
- Salut - Сәлем
- Bonsoir - Қайырлы кеш
- Au revoir - Сау болыңыз
- À bientôt - Кейінірек кездесеміз
- Comment allez-vous? - Қалыңыз қалай? (сыпайы)
- Comment ça va? - Қалыңыз қалай? (бейресми)
- Ça va bien - Жақсы'),
  
  (course4_id, 'Сабақ 2: Артикльдер le, la, les', 'Француз артикльдері.

- le (еркек тегі) - le livre (кітап)
- la (әйел тегі) - la table (үстел)
- les (көпше) - les livres (кітаптар)

Артикльдер зат есімдердің алдында міндетті!'),
  
  (course4_id, 'Сабақ 3: Сандар', 'Француз сандары 1-20.

Un (1), deux (2), trois (3), quatre (4), cinq (5), six (6), sept (7), huit (8), neuf (9), dix (10), onze (11), douze (12), treize (13), quatorze (14), quinze (15), seize (16), dix-sept (17), dix-huit (18), dix-neuf (19), vingt (20)');
  END IF;
END $$;

-- ==========================================
-- КУРС 5: БАСТАУЫШТАРҒА АРНАЛҒАН ИТАЛИЯН ТІЛІ
-- ==========================================
DO $$
DECLARE
  course5_id INTEGER;
BEGIN
  SELECT id INTO course5_id FROM courses WHERE title = 'Бастауыштарға арналған италиян тілі';
  
  IF course5_id IS NULL THEN
    INSERT INTO courses (title, description, language_from, language_to, language) 
    VALUES (
      'Бастауыштарға арналған италиян тілі',
      'Италиян тілін үйреніңіз - мәдениет пен өнер тілі.',
      'Қазақ',
      'Италиян',
      'Италиян'
    ) RETURNING id INTO course5_id;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE course_id = course5_id LIMIT 1) THEN
    INSERT INTO lessons (course_id, title, content) VALUES
  (course5_id, 'Сабақ 1: Сәлемдесулер', 'Италиян сәлемдесулері.

- Ciao! - Сәлем / Сау болыңыз
- Buongiorno - Қайырлы таң / Қайырлы күн
- Buonasera - Қайырлы кеш
- Arrivederci - Сау болыңыз
- Come stai? - Қалыңыз қалай?
- Sto bene - Жақсы
- Piacere - Танысқаныма қуаныштымын'),
  
  (course5_id, 'Сабақ 2: Артикльдер', 'Италиян артикльдері.

- il / lo (еркек тегі) - il libro (кітап)
- la (әйел тегі) - la penna (қалам)
- i / gli (еркек тегі, көпше)
- le (әйел тегі, көпше)');
  END IF;
END $$;

-- ==========================================
-- ТЕСТЫ ДЛЯ КУРСОВ
-- ==========================================
-- Создаем тест для первого курса (Ағылшын тілі)
DO $$
DECLARE
  course1_id INTEGER;
  test1_id INTEGER;
  question1_id INTEGER;
  question2_id INTEGER;
  question3_id INTEGER;
  question4_id INTEGER;
  question5_id INTEGER;
BEGIN
  -- Находим ID первого курса
  SELECT id INTO course1_id FROM courses WHERE title = 'Бастауыштарға арналған ағылшын тілі' LIMIT 1;
  
  IF course1_id IS NOT NULL THEN
    -- Создаем тест, если его еще нет
    SELECT id INTO test1_id FROM tests WHERE course_id = course1_id AND title = 'Ағылшын тілі негіздері тесті' LIMIT 1;
    
    IF test1_id IS NULL THEN
      INSERT INTO tests (course_id, title, description, passing_score, time_limit, max_attempts, is_active)
      VALUES (
        course1_id,
        'Ағылшын тілі негіздері тесті',
        'Бұл тест сіздің ағылшын тілінің негіздерін білу деңгейіңізді тексереді. 70% және одан жоғары нәтиже үшін сертификат аласыз.',
        70,
        15,
        3,
        TRUE
      ) RETURNING id INTO test1_id;

      -- Вопрос 1: Multiple choice
      INSERT INTO test_questions (test_id, question_text, question_type, points, order_index)
      VALUES (test1_id, 'What does "Hello" mean in Kazakh?', 'multiple_choice', 1, 0)
      RETURNING id INTO question1_id;
      
      INSERT INTO test_answers (question_id, answer_text, is_correct, order_index) VALUES
      (question1_id, 'Сәлем', TRUE, 0),
      (question1_id, 'Сау болыңыз', FALSE, 1),
      (question1_id, 'Рахмет', FALSE, 2),
      (question1_id, 'Жақсы', FALSE, 3);

      -- Вопрос 2: True/False
      INSERT INTO test_questions (test_id, question_text, question_type, points, order_index)
      VALUES (test1_id, '"I am" means "Мен болмын" in Kazakh', 'true_false', 1, 1)
      RETURNING id INTO question2_id;
      
      INSERT INTO test_answers (question_id, answer_text, is_correct, order_index) VALUES
      (question2_id, 'True', TRUE, 0),
      (question2_id, 'False', FALSE, 1);

      -- Вопрос 3: Fill in the blank
      INSERT INTO test_questions (test_id, question_text, question_type, points, order_index)
      VALUES (test1_id, 'Complete: "Good _____" means "Қайырлы таң"', 'fill_blank', 1, 2)
      RETURNING id INTO question3_id;
      
      INSERT INTO test_answers (question_id, answer_text, is_correct, order_index) VALUES
      (question3_id, 'morning', TRUE, 0),
      (question3_id, 'afternoon', FALSE, 1),
      (question3_id, 'evening', FALSE, 2);

      -- Вопрос 4: Multiple choice
      INSERT INTO test_questions (test_id, question_text, question_type, points, order_index)
      VALUES (test1_id, 'What is the translation of "How are you?"', 'multiple_choice', 1, 3)
      RETURNING id INTO question4_id;
      
      INSERT INTO test_answers (question_id, answer_text, is_correct, order_index) VALUES
      (question4_id, 'Қалыңыз қалай?', TRUE, 0),
      (question4_id, 'Сіз кімсіз?', FALSE, 1),
      (question4_id, 'Қайда бардыңыз?', FALSE, 2),
      (question4_id, 'Не істеп жатырсыз?', FALSE, 3);

      -- Вопрос 5: Multiple choice
      INSERT INTO test_questions (test_id, question_text, question_type, points, order_index)
      VALUES (test1_id, 'Which word means "қызыл" in English?', 'multiple_choice', 1, 4)
      RETURNING id INTO question5_id;
      
      INSERT INTO test_answers (question_id, answer_text, is_correct, order_index) VALUES
      (question5_id, 'Red', TRUE, 0),
      (question5_id, 'Blue', FALSE, 1),
      (question5_id, 'Green', FALSE, 2),
      (question5_id, 'Yellow', FALSE, 3);
    END IF;
  END IF;
END $$;

-- ==========================================
-- ТЕСТ ДЛЯ КУРСА 2: Испан тілі
-- ==========================================
DO $$
DECLARE
  course2_id INTEGER;
  test2_id INTEGER;
  question1_id INTEGER;
  question2_id INTEGER;
  question3_id INTEGER;
  question4_id INTEGER;
  question5_id INTEGER;
BEGIN
  SELECT id INTO course2_id FROM courses WHERE title = 'Бастауыштарға арналған испан тілі' LIMIT 1;
  
  IF course2_id IS NOT NULL THEN
    SELECT id INTO test2_id FROM tests WHERE course_id = course2_id AND title = 'Испан тілі негіздері тесті' LIMIT 1;
    
    IF test2_id IS NULL THEN
      INSERT INTO tests (course_id, title, description, passing_score, time_limit, max_attempts, is_active)
      VALUES (
        course2_id,
        'Испан тілі негіздері тесті',
        'Бұл тест сіздің испан тілінің негіздерін білу деңгейіңізді тексереді. 70% және одан жоғары нәтиже үшін сертификат аласыз.',
        70,
        15,
        3,
        TRUE
      ) RETURNING id INTO test2_id;

      -- Вопрос 1: Multiple choice
      INSERT INTO test_questions (test_id, question_text, question_type, points, order_index)
      VALUES (test2_id, 'What does "¡Hola!" mean in Kazakh?', 'multiple_choice', 1, 0)
      RETURNING id INTO question1_id;
      
      INSERT INTO test_answers (question_id, answer_text, is_correct, order_index) VALUES
      (question1_id, 'Сәлем', TRUE, 0),
      (question1_id, 'Сау болыңыз', FALSE, 1),
      (question1_id, 'Рахмет', FALSE, 2),
      (question1_id, 'Жақсы', FALSE, 3);

      -- Вопрос 2: Multiple choice
      INSERT INTO test_questions (test_id, question_text, question_type, points, order_index)
      VALUES (test2_id, 'What is the correct article for "libro" (book)?', 'multiple_choice', 1, 1)
      RETURNING id INTO question2_id;
      
      INSERT INTO test_answers (question_id, answer_text, is_correct, order_index) VALUES
      (question2_id, 'el', TRUE, 0),
      (question2_id, 'la', FALSE, 1),
      (question2_id, 'los', FALSE, 2),
      (question2_id, 'las', FALSE, 3);

      -- Вопрос 3: True/False
      INSERT INTO test_questions (test_id, question_text, question_type, points, order_index)
      VALUES (test2_id, '"Buenos días" means "Қайырлы таң" in Kazakh', 'true_false', 1, 2)
      RETURNING id INTO question3_id;
      
      INSERT INTO test_answers (question_id, answer_text, is_correct, order_index) VALUES
      (question3_id, 'True', TRUE, 0),
      (question3_id, 'False', FALSE, 1);

      -- Вопрос 4: Fill in the blank
      INSERT INTO test_questions (test_id, question_text, question_type, points, order_index)
      VALUES (test2_id, 'Complete: "_____ gusto" means "Танысқаныма қуаныштымын"', 'fill_blank', 1, 3)
      RETURNING id INTO question4_id;
      
      INSERT INTO test_answers (question_id, answer_text, is_correct, order_index) VALUES
      (question4_id, 'Mucho', TRUE, 0),
      (question4_id, 'Bueno', FALSE, 1),
      (question4_id, 'Hola', FALSE, 2);

      -- Вопрос 5: Multiple choice
      INSERT INTO test_questions (test_id, question_text, question_type, points, order_index)
      VALUES (test2_id, 'What is the Spanish word for "twenty" (20)?', 'multiple_choice', 1, 4)
      RETURNING id INTO question5_id;
      
      INSERT INTO test_answers (question_id, answer_text, is_correct, order_index) VALUES
      (question5_id, 'Veinte', TRUE, 0),
      (question5_id, 'Diez', FALSE, 1),
      (question5_id, 'Treinta', FALSE, 2),
      (question5_id, 'Cien', FALSE, 3);
    END IF;
  END IF;
END $$;

-- ==========================================
-- ТЕСТ ДЛЯ КУРСА 3: Неміс тілі
-- ==========================================
DO $$
DECLARE
  course3_id INTEGER;
  test3_id INTEGER;
  question1_id INTEGER;
  question2_id INTEGER;
  question3_id INTEGER;
  question4_id INTEGER;
  question5_id INTEGER;
BEGIN
  SELECT id INTO course3_id FROM courses WHERE title = 'Бастауыштарға арналған неміс тілі' LIMIT 1;
  
  IF course3_id IS NOT NULL THEN
    SELECT id INTO test3_id FROM tests WHERE course_id = course3_id AND title = 'Неміс тілі негіздері тесті' LIMIT 1;
    
    IF test3_id IS NULL THEN
      INSERT INTO tests (course_id, title, description, passing_score, time_limit, max_attempts, is_active)
      VALUES (
        course3_id,
        'Неміс тілі негіздері тесті',
        'Бұл тест сіздің неміс тілінің негіздерін білу деңгейіңізді тексереді. 70% және одан жоғары нәтиже үшін сертификат аласыз.',
        70,
        15,
        3,
        TRUE
      ) RETURNING id INTO test3_id;

      -- Вопрос 1: Multiple choice
      INSERT INTO test_questions (test_id, question_text, question_type, points, order_index)
      VALUES (test3_id, 'What does "Hallo!" mean in Kazakh?', 'multiple_choice', 1, 0)
      RETURNING id INTO question1_id;
      
      INSERT INTO test_answers (question_id, answer_text, is_correct, order_index) VALUES
      (question1_id, 'Сәлем', TRUE, 0),
      (question1_id, 'Сау болыңыз', FALSE, 1),
      (question1_id, 'Рахмет', FALSE, 2),
      (question1_id, 'Жақсы', FALSE, 3);

      -- Вопрос 2: Multiple choice
      INSERT INTO test_questions (test_id, question_text, question_type, points, order_index)
      VALUES (test3_id, 'What is the correct article for "Mann" (man)?', 'multiple_choice', 1, 1)
      RETURNING id INTO question2_id;
      
      INSERT INTO test_answers (question_id, answer_text, is_correct, order_index) VALUES
      (question2_id, 'der', TRUE, 0),
      (question2_id, 'die', FALSE, 1),
      (question2_id, 'das', FALSE, 2),
      (question2_id, 'den', FALSE, 3);

      -- Вопрос 3: True/False
      INSERT INTO test_questions (test_id, question_text, question_type, points, order_index)
      VALUES (test3_id, '"Guten Morgen" means "Қайырлы таң" in Kazakh', 'true_false', 1, 2)
      RETURNING id INTO question3_id;
      
      INSERT INTO test_answers (question_id, answer_text, is_correct, order_index) VALUES
      (question3_id, 'True', TRUE, 0),
      (question3_id, 'False', FALSE, 1);

      -- Вопрос 4: Multiple choice
      INSERT INTO test_questions (test_id, question_text, question_type, points, order_index)
      VALUES (test3_id, 'What is the German word for "one" (1)?', 'multiple_choice', 1, 3)
      RETURNING id INTO question4_id;
      
      INSERT INTO test_answers (question_id, answer_text, is_correct, order_index) VALUES
      (question4_id, 'Eins', TRUE, 0),
      (question4_id, 'Zwei', FALSE, 1),
      (question4_id, 'Drei', FALSE, 2),
      (question4_id, 'Zehn', FALSE, 3);

      -- Вопрос 5: Fill in the blank
      INSERT INTO test_questions (test_id, question_text, question_type, points, order_index)
      VALUES (test3_id, 'Complete: "Guten _____" means "Қайырлы күн"', 'fill_blank', 1, 4)
      RETURNING id INTO question5_id;
      
      INSERT INTO test_answers (question_id, answer_text, is_correct, order_index) VALUES
      (question5_id, 'Tag', TRUE, 0),
      (question5_id, 'Morgen', FALSE, 1),
      (question5_id, 'Abend', FALSE, 2);
    END IF;
  END IF;
END $$;

-- ==========================================
-- ТЕСТ ДЛЯ КУРСА 4: Француз тілі
-- ==========================================
DO $$
DECLARE
  course4_id INTEGER;
  test4_id INTEGER;
  question1_id INTEGER;
  question2_id INTEGER;
  question3_id INTEGER;
  question4_id INTEGER;
  question5_id INTEGER;
BEGIN
  SELECT id INTO course4_id FROM courses WHERE title = 'Бастауыштарға арналған француз тілі' LIMIT 1;
  
  IF course4_id IS NOT NULL THEN
    SELECT id INTO test4_id FROM tests WHERE course_id = course4_id AND title = 'Француз тілі негіздері тесті' LIMIT 1;
    
    IF test4_id IS NULL THEN
      INSERT INTO tests (course_id, title, description, passing_score, time_limit, max_attempts, is_active)
      VALUES (
        course4_id,
        'Француз тілі негіздері тесті',
        'Бұл тест сіздің француз тілінің негіздерін білу деңгейіңізді тексереді. 70% және одан жоғары нәтиже үшін сертификат аласыз.',
        70,
        15,
        3,
        TRUE
      ) RETURNING id INTO test4_id;

      -- Вопрос 1: Multiple choice
      INSERT INTO test_questions (test_id, question_text, question_type, points, order_index)
      VALUES (test4_id, 'What does "Bonjour" mean in Kazakh?', 'multiple_choice', 1, 0)
      RETURNING id INTO question1_id;
      
      INSERT INTO test_answers (question_id, answer_text, is_correct, order_index) VALUES
      (question1_id, 'Қайырлы күн / Сәлеметсіз бе', TRUE, 0),
      (question1_id, 'Сау болыңыз', FALSE, 1),
      (question1_id, 'Рахмет', FALSE, 2),
      (question1_id, 'Жақсы', FALSE, 3);

      -- Вопрос 2: Multiple choice
      INSERT INTO test_questions (test_id, question_text, question_type, points, order_index)
      VALUES (test4_id, 'What is the correct article for "livre" (book)?', 'multiple_choice', 1, 1)
      RETURNING id INTO question2_id;
      
      INSERT INTO test_answers (question_id, answer_text, is_correct, order_index) VALUES
      (question2_id, 'le', TRUE, 0),
      (question2_id, 'la', FALSE, 1),
      (question2_id, 'les', FALSE, 2),
      (question2_id, 'un', FALSE, 3);

      -- Вопрос 3: True/False
      INSERT INTO test_questions (test_id, question_text, question_type, points, order_index)
      VALUES (test4_id, '"Bonsoir" means "Қайырлы кеш" in Kazakh', 'true_false', 1, 2)
      RETURNING id INTO question3_id;
      
      INSERT INTO test_answers (question_id, answer_text, is_correct, order_index) VALUES
      (question3_id, 'True', TRUE, 0),
      (question3_id, 'False', FALSE, 1);

      -- Вопрос 4: Multiple choice
      INSERT INTO test_questions (test_id, question_text, question_type, points, order_index)
      VALUES (test4_id, 'What is the French word for "five" (5)?', 'multiple_choice', 1, 3)
      RETURNING id INTO question4_id;
      
      INSERT INTO test_answers (question_id, answer_text, is_correct, order_index) VALUES
      (question4_id, 'Cinq', TRUE, 0),
      (question4_id, 'Quatre', FALSE, 1),
      (question4_id, 'Six', FALSE, 2),
      (question4_id, 'Dix', FALSE, 3);

      -- Вопрос 5: Fill in the blank
      INSERT INTO test_questions (test_id, question_text, question_type, points, order_index)
      VALUES (test4_id, 'Complete: "Comment _____ vous?" means "Қалыңыз қалай?" (сыпайы)', 'fill_blank', 1, 4)
      RETURNING id INTO question5_id;
      
      INSERT INTO test_answers (question_id, answer_text, is_correct, order_index) VALUES
      (question5_id, 'allez', TRUE, 0),
      (question5_id, 'ça va', FALSE, 1),
      (question5_id, 'êtes', FALSE, 2);
    END IF;
  END IF;
END $$;

-- ==========================================
-- ТЕСТ ДЛЯ КУРСА 5: Италиян тілі
-- ==========================================
DO $$
DECLARE
  course5_id INTEGER;
  test5_id INTEGER;
  question1_id INTEGER;
  question2_id INTEGER;
  question3_id INTEGER;
  question4_id INTEGER;
  question5_id INTEGER;
BEGIN
  SELECT id INTO course5_id FROM courses WHERE title = 'Бастауыштарға арналған италиян тілі' LIMIT 1;
  
  IF course5_id IS NOT NULL THEN
    SELECT id INTO test5_id FROM tests WHERE course_id = course5_id AND title = 'Италиян тілі негіздері тесті' LIMIT 1;
    
    IF test5_id IS NULL THEN
      INSERT INTO tests (course_id, title, description, passing_score, time_limit, max_attempts, is_active)
      VALUES (
        course5_id,
        'Италиян тілі негіздері тесті',
        'Бұл тест сіздің италиян тілінің негіздерін білу деңгейіңізді тексереді. 70% және одан жоғары нәтиже үшін сертификат аласыз.',
        70,
        15,
        3,
        TRUE
      ) RETURNING id INTO test5_id;

      -- Вопрос 1: Multiple choice
      INSERT INTO test_questions (test_id, question_text, question_type, points, order_index)
      VALUES (test5_id, 'What does "Ciao!" mean in Italian context?', 'multiple_choice', 1, 0)
      RETURNING id INTO question1_id;
      
      INSERT INTO test_answers (question_id, answer_text, is_correct, order_index) VALUES
      (question1_id, 'Сәлем / Сау болыңыз', TRUE, 0),
      (question1_id, 'Рахмет', FALSE, 1),
      (question1_id, 'Жақсы', FALSE, 2),
      (question1_id, 'Кешіріңіз', FALSE, 3);

      -- Вопрос 2: Multiple choice
      INSERT INTO test_questions (test_id, question_text, question_type, points, order_index)
      VALUES (test5_id, 'What is the correct article for "libro" (book) in Italian?', 'multiple_choice', 1, 1)
      RETURNING id INTO question2_id;
      
      INSERT INTO test_answers (question_id, answer_text, is_correct, order_index) VALUES
      (question2_id, 'il', TRUE, 0),
      (question2_id, 'la', FALSE, 1),
      (question2_id, 'lo', FALSE, 2),
      (question2_id, 'i', FALSE, 3);

      -- Вопрос 3: True/False
      INSERT INTO test_questions (test_id, question_text, question_type, points, order_index)
      VALUES (test5_id, '"Buongiorno" means "Қайырлы таң / Қайырлы күн" in Kazakh', 'true_false', 1, 2)
      RETURNING id INTO question3_id;
      
      INSERT INTO test_answers (question_id, answer_text, is_correct, order_index) VALUES
      (question3_id, 'True', TRUE, 0),
      (question3_id, 'False', FALSE, 1);

      -- Вопрос 4: Multiple choice
      INSERT INTO test_questions (test_id, question_text, question_type, points, order_index)
      VALUES (test5_id, 'What is the Italian word for "good evening"?', 'multiple_choice', 1, 3)
      RETURNING id INTO question4_id;
      
      INSERT INTO test_answers (question_id, answer_text, is_correct, order_index) VALUES
      (question4_id, 'Buonasera', TRUE, 0),
      (question4_id, 'Buongiorno', FALSE, 1),
      (question4_id, 'Arrivederci', FALSE, 2),
      (question4_id, 'Piacere', FALSE, 3);

      -- Вопрос 5: Fill in the blank
      INSERT INTO test_questions (test_id, question_text, question_type, points, order_index)
      VALUES (test5_id, 'Complete: "Come _____?" means "Қалыңыз қалай?"', 'fill_blank', 1, 4)
      RETURNING id INTO question5_id;
      
      INSERT INTO test_answers (question_id, answer_text, is_correct, order_index) VALUES
      (question5_id, 'stai', TRUE, 0),
      (question5_id, 'sei', FALSE, 1),
      (question5_id, 'hai', FALSE, 2);
    END IF;
  END IF;
END $$;

