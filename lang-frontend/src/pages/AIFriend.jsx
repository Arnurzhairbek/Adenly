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
  Person,
  Favorite,
  ChatBubble,
  ArrowBack,
  BusinessCenter,
  Palette,
  FitnessCenter,
  MenuBook,
  Restaurant,
  Public,
  Lightbulb,
  RecordVoiceOver
} from "@mui/icons-material";
import { Avatar } from "@mui/material";
import { toast } from "../components/Toast";

// Доступные AI-друзья с разными характеристиками
const AI_FRIENDS = [
  {
    id: 'alex',
    name: 'Alex',
    avatarIcon: BusinessCenter,
    avatarColor: '#6366f1',
    personality: 'Достықтық және ашық',
    description: 'Саяхат, спорт және технологиялар туралы талқылауды ұнатады',
    topics: ['travel', 'sports', 'technology'],
    language: 'english',
    greeting: "Hey! I'm Alex. Nice to meet you! What's on your mind today?"
  },
  {
    id: 'sarah',
    name: 'Sarah',
    avatarIcon: Palette,
    avatarColor: '#ec4899',
    personality: 'Шығармашылық және шабыттандыратын',
    description: 'Өнер, музыка және мәдениетті жақсы көреді',
    topics: ['art', 'music', 'culture'],
    language: 'english',
    greeting: "Hi there! I'm Sarah. I love talking about art and creativity. What interests you?"
  },
  {
    id: 'mike',
    name: 'Mike',
    avatarIcon: FitnessCenter,
    avatarColor: '#10b981',
    personality: 'Белсенді және энергиялық',
    description: 'Фитнес, денсаулық және белсенді өмір салтымен қызығады',
    topics: ['fitness', 'health', 'lifestyle'],
    language: 'english',
    greeting: "Hey! Mike here! Ready to chat? I'm all about staying active and healthy!"
  },
  {
    id: 'emma',
    name: 'Emma',
    avatarIcon: MenuBook,
    avatarColor: '#8b5cf6',
    personality: 'Ақылды және қызығушылықты',
    description: 'Ғылым, кітаптар және білім беруге қызығады',
    topics: ['science', 'books', 'education'],
    language: 'english',
    greeting: "Hello! I'm Emma. I love learning new things. What would you like to talk about?"
  },
  {
    id: 'david',
    name: 'David',
    avatarIcon: Restaurant,
    avatarColor: '#f59e0b',
    personality: 'Күлкілі және ашық',
    description: 'Тағам, ойын-сауық және жақсы әзілдерді жақсы көреді',
    topics: ['food', 'entertainment', 'humor'],
    language: 'english',
    greeting: "Hey! David here! I'm always up for a good conversation, especially about food!"
  },
  {
    id: 'lisa',
    name: 'Lisa',
    avatarIcon: Public,
    avatarColor: '#06b6d4',
    personality: 'Ашық және достықтық',
    description: 'Әртүрлі мәдениеттер мен саяхаттар туралы талқылауды ұнатады',
    topics: ['culture', 'travel', 'languages'],
    language: 'english',
    greeting: "Hi! I'm Lisa. I'm fascinated by different cultures and languages. Let's chat!"
  }
];

export default function AIFriend() {
  const navigate = useNavigate();
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Инициализация Web Speech API
  useEffect(() => {
    if (selectedFriend && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = selectedFriend.language === 'english' ? 'en-US' : 
                                    selectedFriend.language === 'russian' ? 'ru-RU' : 
                                    selectedFriend.language === 'kazakh' ? 'kk-KZ' : 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
        toast.error("Сөйлеуді тану қатесі");
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
  }, [selectedFriend]);

  // Автопрокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startConversation = async (friend) => {
    setIsStarting(true);
    try {
      const response = await aiConversation.start({
        language: friend.language,
        topic: friend.topics[0] || 'general',
        metadata: {
          friendId: friend.id,
          friendName: friend.name,
          personality: friend.personality
        }
      });

      setConversationId(response.conversationId);
      setSelectedFriend(friend);
      setMessages([
        {
          role: "assistant",
          content: friend.greeting,
          timestamp: new Date().toISOString(),
          friendName: friend.name,
          avatarIcon: friend.avatarIcon,
          avatarColor: friend.avatarColor
        },
      ]);
      toast.success(`${friend.name} мен әңгіме басталды!`);
    } catch (err) {
      console.error("Әңгімені бастау қатесі:", err);
      toast.error(err.message || "Әңгімені бастау қатесі");
    } finally {
      setIsStarting(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !conversationId || !selectedFriend) return;

    const userMessage = {
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      console.log("Отправка сообщения:", userMessage.content);
      const response = await aiConversation.sendMessage(
        conversationId,
        userMessage.content
      );

      console.log("Получен ответ от AI:", response);

      if (!response || !response.response) {
        console.error("Пустой ответ от сервера:", response);
        toast.error("AI-дос жауап бермеді. Қайталап көріңіз.");
        return;
      }

      const assistantMessage = {
        role: "assistant",
        content: response.response,
        timestamp: new Date().toISOString(),
        friendName: selectedFriend.name,
        avatarIcon: selectedFriend.avatarIcon,
        avatarColor: selectedFriend.avatarColor,
        feedback: response.feedback,
        suggestions: response.suggestions
      };

      console.log("Добавление сообщения AI:", assistantMessage);
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Хабарлама жіберу қатесі:", err);
      toast.error(err.message || "Хабарлама жіберу қатесі");
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = () => {
    if (!recognitionRef.current) {
      toast.error("Сіздің браузеріңізде сөйлеуді тану қолдау көрсетілмейді");
      return;
    }

    try {
      recognitionRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Жазуды бастау қатесі:", err);
      toast.error("Жазуды бастау қатесі");
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
      utterance.lang = selectedFriend?.language === 'english' ? 'en-US' : 
                       selectedFriend?.language === 'russian' ? 'ru-RU' : 
                       selectedFriend?.language === 'kazakh' ? 'kk-KZ' : 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const endConversation = async () => {
    if (!conversationId) {
      setSelectedFriend(null);
      setMessages([]);
      return;
    }

    try {
      const result = await aiConversation.end(conversationId);
      toast.success(`Әңгіме аяқталды! Баға: ${result.score}/100`);
      
      setTimeout(() => {
        setSelectedFriend(null);
        setMessages([]);
        setConversationId(null);
      }, 2000);
    } catch (err) {
      console.error("Әңгімені аяқтау қатесі:", err);
      toast.error(err.message || "Әңгімені аяқтау қатесі");
    }
  };

  // Выбор друга
  if (!selectedFriend && !isStarting) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-800 via-purple-700 to-purple-800 p-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  AI-досыңды тап
                </h1>
                <p className="text-purple-200 text-lg">
                  Сөйлесу тілін тәжірибелеу үшін әңгімелесушіні таңда
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => navigate("/home")}
                className="bg-purple-700/30 hover:bg-purple-700/50 text-white border-purple-400/30"
              >
                <ArrowBack sx={{ mr: 1 }} />
                Артқа
              </Button>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AI_FRIENDS.map((friend, index) => (
              <motion.div
                key={friend.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <Card 
                  className="bg-purple-600/20 backdrop-blur-sm border-2 border-purple-400/30 hover:border-purple-400/60 cursor-pointer transition-all h-full"
                  onClick={() => startConversation(friend)}
                >
                  <div className="p-6">
                    <div className="text-center mb-4">
                      <div className="flex justify-center mb-3">
                        <Avatar 
                          sx={{ 
                            width: 80, 
                            height: 80, 
                            bgcolor: friend.avatarColor,
                            fontSize: '2.5rem'
                          }}
                        >
                          {friend.avatarIcon && (() => {
                            const IconComponent = friend.avatarIcon;
                            return <IconComponent sx={{ fontSize: 40 }} />;
                          })()}
                        </Avatar>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {friend.name}
                      </h3>
                      <Badge className="bg-purple-500/50 text-white mb-3">
                        {friend.personality}
                      </Badge>
                    </div>
                    
                    <p className="text-purple-200 text-center mb-4">
                      {friend.description}
                    </p>

                    <div className="flex flex-wrap gap-2 justify-center mb-4">
                      {friend.topics.map((topic, idx) => (
                        <Badge 
                          key={idx}
                          variant="default"
                          className="bg-purple-700/50 text-purple-200 text-xs"
                        >
                          {topic}
                        </Badge>
                      ))}
                    </div>

                    <Button
                      variant="primary"
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        startConversation(friend);
                      }}
                    >
                      <ChatBubble sx={{ mr: 1 }} />
                      Әңгімені бастау
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isStarting) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-800 via-purple-700 to-purple-800 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Досқа қосылуда..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-800 via-purple-700 to-purple-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Заголовок с информацией о друге */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {selectedFriend?.avatarIcon && (() => {
                const IconComponent = selectedFriend.avatarIcon;
                return (
                  <Avatar 
                    sx={{ 
                      width: 64, 
                      height: 64, 
                      bgcolor: selectedFriend.avatarColor,
                      fontSize: '2rem'
                    }}
                  >
                    <IconComponent sx={{ fontSize: 32 }} />
                  </Avatar>
                );
              })()}
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {selectedFriend?.name}
                </h1>
                <p className="text-purple-200">
                  {selectedFriend?.personality}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedFriend(null);
                  setMessages([]);
                  setConversationId(null);
                }}
                className="bg-purple-700/30 hover:bg-purple-700/50 text-white border-purple-400/30"
              >
                <ArrowBack sx={{ mr: 1 }} />
                Басқасын таңдау
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/home")}
                className="bg-purple-700/30 hover:bg-purple-700/50 text-white border-purple-400/30"
              >
                <Close />
              </Button>
            </div>
          </div>
        </motion.div>

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
                    className={`max-w-[80%] rounded-2xl p-4 ${
                      message.role === "user"
                        ? "bg-purple-600 text-white rounded-br-none"
                        : "bg-purple-700/50 text-white rounded-bl-none"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex items-center gap-2 mb-2">
                        {message.avatarIcon && (
                          <Avatar 
                            sx={{ 
                              width: 32, 
                              height: 32, 
                              bgcolor: message.avatarColor || '#8b5cf6',
                              fontSize: '1rem'
                            }}
                          >
                            {(() => {
                              const IconComponent = message.avatarIcon;
                              return <IconComponent sx={{ fontSize: 18 }} />;
                            })()}
                          </Avatar>
                        )}
                        <span className="font-semibold text-purple-200">
                          {message.friendName}
                        </span>
                      </div>
                    )}
                    <p className="mb-2">{message.content}</p>
                    {message.feedback && (
                      <div className="mt-2 p-2 bg-yellow-500/20 rounded text-yellow-200 text-sm flex items-start gap-2">
                        <Lightbulb sx={{ fontSize: 16, mt: 0.5 }} />
                        <span>{message.feedback}</span>
                      </div>
                    )}
                    {message.role === "assistant" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => speakText(message.content)}
                        className="mt-2 bg-purple-800/40 hover:bg-purple-800/60 text-purple-200 hover:text-white border-purple-500/30"
                      >
                        <VolumeUp sx={{ fontSize: 16, mr: 1 }} />
                        Айту
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-purple-700/50 rounded-2xl rounded-bl-none p-4 flex items-center gap-2">
                  {selectedFriend?.avatarIcon && (() => {
                    const IconComponent = selectedFriend.avatarIcon;
                    return (
                      <Avatar 
                        sx={{ 
                          width: 32, 
                          height: 32, 
                          bgcolor: selectedFriend.avatarColor,
                          fontSize: '1rem'
                        }}
                      >
                        <IconComponent sx={{ fontSize: 18 }} />
                      </Avatar>
                    );
                  })()}
                  <LoadingSpinner size="sm" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </Card>

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
                  placeholder={`${selectedFriend?.name} үшін жазыңыз...`}
                  className="flex-1 bg-purple-700/50 border-purple-400/30 text-white placeholder-purple-300"
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
                <Badge variant="error" className="animate-pulse flex items-center gap-1">
                  <RecordVoiceOver sx={{ fontSize: 14 }} />
                  Жазылуда...
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
            className="bg-purple-700/30 hover:bg-purple-700/50 text-white border-purple-400/30"
          >
            Әңгімені аяқтау
          </Button>
        </div>
      </div>
    </div>
  );
}

