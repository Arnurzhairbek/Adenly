import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "../components/Toast";
import { tests } from "../api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import LoadingSpinner from "../components/LoadingSpinner";
import Badge from "../components/ui/Badge";

export default function Test() {
  const { testId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [timeStarted, setTimeStarted] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    loadTest();
  }, [testId]);

  useEffect(() => {
    if (test?.time_limit && timeStarted && !showResults) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - timeStarted) / 1000);
        const remaining = test.time_limit * 60 - elapsed;
        
        if (remaining <= 0) {
          clearInterval(interval);
          handleAutoSubmit();
        } else {
          setTimeRemaining(remaining);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [test, timeStarted, showResults]);

  const loadTest = async () => {
    try {
      setLoading(true);
      const data = await tests.start(testId);
      setTest(data.test);
      setQuestions(data.questions);
      setTimeStarted(Date.now());
      setTimeRemaining(data.test.time_limit ? data.test.time_limit * 60 : null);
    } catch (err) {
      toast.error(err.message || "Тестті жүктеу қатесі");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answerId, userAnswer = null) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { answer_id: answerId, user_answer: userAnswer }
    }));
  };

  const handleAutoSubmit = async () => {
    if (submitting) return;
    toast.info("Уақыт аяқталды! Жауаптар автоматты түрде жіберіледі.");
    await handleSubmit();
  };

  const handleSubmit = async () => {
    if (submitting) return;

    // Проверяем, что все вопросы отвечены
    const unanswered = questions.filter(q => !responses[q.id]);
    if (unanswered.length > 0) {
      const confirm = window.confirm(
        `${unanswered.length} сұраққа жауап берілмеген. Барлық сұрақтарға жауап беру міндетті емес. Жалғастырамыз ба?`
      );
      if (!confirm) return;
    }

    setSubmitting(true);

    try {
      const timeTaken = Math.floor((Date.now() - timeStarted) / 1000);
      const responsesArray = Object.entries(responses).map(([questionId, response]) => ({
        question_id: parseInt(questionId),
        answer_id: response.answer_id || null,
        user_answer: response.user_answer || null
      }));

      const result = await tests.submit(testId, responsesArray, timeTaken);
      setResults(result);
      setShowResults(true);
      
      if (result.passed) {
        toast.success(`Құттықтаймыз! Сіз тестті ${result.score}% бойынша тапсырдыңыз!`);
      } else {
        toast.warning(`Тестті тапсыру үшін кемінде ${test.passing_score}% қажет. Сіздің нәтижеңіз: ${result.score}%`);
      }
    } catch (err) {
      toast.error(err.message || "Тестті жіберу қатесі");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Тест жүктелуде..." />
      </div>
    );
  }

  if (showResults && results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 p-6 text-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-8"
          >
            <Card className="p-8">
              {results.passed ? (
                <>
                  <h1 className="text-4xl font-bold mb-4 text-green-400">
                    Құттықтаймыз!
                  </h1>
                  <p className="text-xl mb-6">
                    Сіз тестті сәтті тапсырдыңыз!
                  </p>
                  <div className="flex justify-center gap-4 mb-6">
                    <Badge variant="success" className="text-lg px-4 py-2">
                      Нәтиже: {results.score}%
                    </Badge>
                    <Badge variant="info" className="text-lg px-4 py-2">
                      Дұрыс: {results.correct_answers}/{results.total_questions}
                    </Badge>
                  </div>
                  {results.certificate && (
                    <div className="mt-6 p-4 bg-green-500/20 rounded-lg border border-green-500/50">
                      <p className="text-lg font-semibold mb-2">Сертификат алынды!</p>
                      <p className="text-sm text-white/80">
                        Сертификат нөмірі: {results.certificate.certificate_number}
                      </p>
                      <Button
                        variant="primary"
                        onClick={() => navigate(`/certificates/${results.certificate.id}`)}
                        className="mt-4"
                      >
                        Сертификатты көру
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h1 className="text-4xl font-bold mb-4 text-yellow-400">
                    Тест тапсырылмады
                  </h1>
                  <p className="text-xl mb-6">
                    Тапсыру үшін кемінде {test.passing_score}% қажет
                  </p>
                  <div className="flex justify-center gap-4 mb-6">
                    <Badge variant="warning" className="text-lg px-4 py-2">
                      Нәтиже: {results.score}%
                    </Badge>
                    <Badge variant="info" className="text-lg px-4 py-2">
                      Дұрыс: {results.correct_answers}/{results.total_questions}
                    </Badge>
                  </div>
                </>
              )}
              <div className="flex gap-4 justify-center mt-8">
                <Button
                  variant="ghost"
                  onClick={() => navigate(-1)}
                >
                  Артқа
                </Button>
                {!results.passed && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      setShowResults(false);
                      setResponses({});
                      loadTest();
                    }}
                  >
                    Қайта тапсыру
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 p-6 text-white">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{test?.title}</h1>
              {test?.description && (
                <p className="text-white/70">{test.description}</p>
              )}
            </div>
            {timeRemaining !== null && (
              <div className="text-right">
                <Badge 
                  variant={timeRemaining < 300 ? "danger" : "info"}
                  className="text-lg px-4 py-2"
                >
                  {formatTime(timeRemaining)}
                </Badge>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-white/60">
            <span>Сұрақтар: {questions.length}</span>
            <span>•</span>
            <span>Тапсыру үшін: {test?.passing_score}%</span>
          </div>
        </motion.div>

        {/* Questions */}
        <div className="space-y-6">
          <AnimatePresence>
            {questions.map((question, index) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-semibold">
                        {index + 1}. {question.question_text}
                      </h3>
                      <Badge variant="info">{question.points} ұпай</Badge>
                    </div>
                  </div>

                  {question.question_type === 'multiple_choice' && (
                    <div className="space-y-3">
                      {question.answers.map((answer) => (
                        <label
                          key={answer.id}
                          className={`
                            flex items-center p-4 rounded-lg cursor-pointer transition-all
                            ${responses[question.id]?.answer_id === answer.id
                              ? 'bg-indigo-600 border-2 border-indigo-400'
                              : 'bg-slate-700/50 border-2 border-transparent hover:border-indigo-500/50'
                            }
                          `}
                        >
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={answer.id}
                            checked={responses[question.id]?.answer_id === answer.id}
                            onChange={() => handleAnswerChange(question.id, answer.id)}
                            className="mr-4 w-5 h-5"
                          />
                          <span>{answer.answer_text}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {question.question_type === 'true_false' && (
                    <div className="space-y-3">
                      {question.answers.map((answer) => (
                        <label
                          key={answer.id}
                          className={`
                            flex items-center p-4 rounded-lg cursor-pointer transition-all
                            ${responses[question.id]?.answer_id === answer.id
                              ? 'bg-indigo-600 border-2 border-indigo-400'
                              : 'bg-slate-700/50 border-2 border-transparent hover:border-indigo-500/50'
                            }
                          `}
                        >
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={answer.id}
                            checked={responses[question.id]?.answer_id === answer.id}
                            onChange={() => handleAnswerChange(question.id, answer.id)}
                            className="mr-4 w-5 h-5"
                          />
                          <span>{answer.answer_text}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {question.question_type === 'fill_blank' && (
                    <div>
                      <input
                        type="text"
                        value={responses[question.id]?.user_answer || ''}
                        onChange={(e) => handleAnswerChange(question.id, null, e.target.value)}
                        placeholder="Жауабыңызды енгізіңіз..."
                        className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border-2 border-indigo-500/30 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex justify-between items-center"
        >
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            disabled={submitting}
          >
            Артқа
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={submitting}
            disabled={submitting}
            className="px-8"
          >
            {submitting ? "Жіберілуде..." : "Тестті тапсыру"}
          </Button>
        </motion.div>

        {/* Progress indicator */}
        <div className="mt-4 text-center text-sm text-white/60">
          Жауап берілген: {Object.keys(responses).length} / {questions.length}
        </div>
      </div>
    </div>
  );
}

