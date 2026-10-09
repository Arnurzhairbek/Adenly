-- Скрипт для добавления тестов для всех языков
-- Этот скрипт можно запустить вручную, если тесты еще не добавлены

-- ==========================================
-- ТЕСТ ДЛЯ КУРСА 1: Ағылшын тілі
-- ==========================================
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
  SELECT id INTO course1_id FROM courses WHERE title = 'Бастауыштарға арналған ағылшын тілі' LIMIT 1;
  
  IF course1_id IS NOT NULL THEN
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

