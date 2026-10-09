import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { aiConversation } from "../api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import LoadingSpinner from "../components/LoadingSpinner";
import Badge from "../components/ui/Badge";
import { 
  Mic, 
  Send, 
  Stop, 
  VolumeUp,
  Close,
  CheckCircle,
  Warning
} from "@mui/icons-material";
import { toast } from "../components/Toast";

export default function AIConversation() {
  const navigate = useNavigate();
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState("english");
  const [topic, setTopic] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Инициализация Web Speech API
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = language === 'english' ? 'en-US' : 
                                    language === 'russian' ? 'ru-RU' : 
                                    language === 'kazakh' ? 'kk-KZ' : 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
        toast.error("Ошибка распознавания речи");
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language]);

  // Автопрокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startConversation = async () => {
    if (!topic.trim()) {
      toast.error("Пожалуйста, выберите тему для разговора");
      return;
    }

    setIsStarting(true);
    try {
      const response = await aiConversation.start({
        language,
        topic: topic.trim(),
      });

      setConversationId(response.conversationId);
      setMessages([
        {
          role: "assistant",
          content: response.message,
          timestamp: new Date().toISOString(),
        },
      ]);
      toast.success("Разговор начат!");
    } catch (err) {
      console.error("Ошибка начала разговора:", err);
      toast.error(err.message || "Ошибка начала разговора");
    } finally {
      setIsStarting(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !conversationId) return;

    const userMessage = {
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await aiConversation.sendMessage(
        conversationId,
        userMessage.content
      );

      const assistantMessage = {
        role: "assistant",
        content: response.response,
        feedback: response.feedback,
        corrections: response.corrections,
        suggestions: response.suggestions,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (response.feedback) {
        setFeedback(response.feedback);
      }
    } catch (err) {
      console.error("Ошибка отправки сообщения:", err);
      toast.error(err.message || "Ошибка отправки сообщения");
    } finally {
      setIsLoading(false);
    }
  };

  const endConversation = async () => {
    if (!conversationId) return;

    try {
      const result = await aiConversation.end(conversationId);
      setScore(result.score);
      toast.success(`Разговор завершен! Оценка: ${result.score}/100`);
      
      setTimeout(() => {
        navigate("/home");
      }, 3000);
    } catch (err) {
      console.error("Ошибка завершения разговора:", err);
      toast.error(err.message || "Ошибка завершения разговора");
    }
  };

  const startRecording = () => {
    if (!recognitionRef.current) {
      toast.error("Распознавание речи не поддерживается в вашем браузере");
      return;
    }

    try {
      recognitionRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Ошибка начала записи:", err);
      toast.error("Ошибка начала записи");
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'english' ? 'en-US' : 
                       language === 'russian' ? 'ru-RU' : 
                       language === 'kazakh' ? 'kk-KZ' : 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  if (!conversationId && !isStarting) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-800 via-purple-700 to-purple-800 p-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-purple-600/20 backdrop-blur-sm border-2 border-purple-400/30">
              <div className="p-8">
                <h1 className="text-3xl font-bold text-white mb-6 text-center">
                  Разговорная практика с AI
                </h1>

                <div className="space-y-6">
                  <div>
                    <label className="block text-white font-semibold mb-2">
                      Выберите язык
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full p-3 rounded-lg bg-purple-700/50 border border-purple-400/30 text-white"
                    >
                      <option value="english">English</option>
                      <option value="russian">Русский</option>
                      <option value="kazakh">Қазақша</option>
                      <option value="spanish">Español</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2">
                      Тема разговора
                    </label>
                    <Input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Например: путешествия, еда, хобби..."
                      className="w-full"
                    />
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    onClick={startConversation}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={!topic.trim()}
                  >
                    Начать разговор
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  if (isStarting) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-800 via-purple-700 to-purple-800 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Начинаем разговор..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-800 via-purple-700 to-purple-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Разговор с AI</h1>
            <p className="text-purple-200">
              Язык: {language} | Тема: {topic}
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate("/home")}
            className="text-white hover:bg-purple-700/50"
          >
            <Close />
          </Button>
        </div>

        {/* Оценка после завершения */}
        {score !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6"
          >
            <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-400/50">
              <div className="p-6 text-center">
                <CheckCircle sx={{ fontSize: 64, color: '#10b981', mb: 2 }} />
                <h2 className="text-2xl font-bold text-white mb-2">
                  Разговор завершен!
                </h2>
                <p className="text-3xl font-bold text-green-300 mb-4">
                  Оценка: {score}/100
                </p>
                <p className="text-white/80">
                  Вы будете перенаправлены на главную страницу...
                </p>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Сообщения */}
        <Card className="bg-purple-600/20 backdrop-blur-sm border-2 border-purple-400/30 mb-6">
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === "user"
                        ? "bg-purple-600 text-white"
                        : "bg-purple-700/50 text-white"
                    }`}
                  >
                    <p className="mb-2">{message.content}</p>
                    {message.feedback && (
                      <div className="mt-2 p-2 bg-yellow-500/20 rounded text-yellow-200 text-sm">
                        <Warning sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                        {message.feedback}
                      </div>
                    )}
                    {message.role === "assistant" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => speakText(message.content)}
                        className="mt-2 text-purple-200 hover:text-white"
                      >
                        <VolumeUp sx={{ fontSize: 16, mr: 1 }} />
                        Произнести
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-purple-700/50 rounded-lg p-4">
                  <LoadingSpinner size="sm" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </Card>

        {/* Обратная связь */}
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-yellow-500/20 border-2 border-yellow-400/30">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Warning sx={{ fontSize: 24, color: '#f59e0b' }} />
                  <h3 className="text-lg font-bold text-white">Обратная связь</h3>
                </div>
                <p className="text-yellow-200">{feedback}</p>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Поле ввода */}
        <Card className="bg-purple-600/20 backdrop-blur-sm border-2 border-purple-400/30">
          <div className="p-4">
            <div className="flex gap-3">
              <div className="flex-1 flex gap-2">
                <Input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Введите ваше сообщение..."
                  className="flex-1 bg-purple-700/50 border-purple-400/30 text-white"
                />
                <Button
                  variant="ghost"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`${
                    isRecording
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-purple-600 hover:bg-purple-700 text-white"
                  }`}
                >
                  {isRecording ? <Stop /> : <Mic />}
                </Button>
              </div>
              <Button
                variant="primary"
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Send />
              </Button>
            </div>
            {isRecording && (
              <div className="mt-2 text-center">
                <Badge variant="error" className="animate-pulse">
                  Запись...
                </Badge>
              </div>
            )}
          </div>
        </Card>

        {/* Кнопка завершения */}
        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={endConversation}
            className="text-white hover:bg-purple-700/50"
          >
            Завершить разговор
          </Button>
        </div>
      </div>
    </div>
  );
}

