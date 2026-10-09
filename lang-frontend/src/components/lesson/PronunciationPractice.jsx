import { useState } from "react";
import { motion } from "framer-motion";
import Button from "../ui/Button";

export default function PronunciationPractice({ words, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);

  const currentWord = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;

  const speak = (text, lang = 'en-US') => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.8;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleListen = () => {
    speak(currentWord.word, currentWord.lang || 'en-US');
  };

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      if (onComplete) {
        onComplete();
      }
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="w-full">
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-br from-slate-700 to-purple-800 rounded-xl p-10 border-2 border-purple-400/40 shadow-lg text-center min-h-[250px] flex flex-col items-center justify-center"
      >
        <p className="text-4xl font-bold text-white mb-4 leading-tight">
          {currentWord?.word || 'No word'}
        </p>
        <p className="text-xl text-gray-200 mb-2">
          {currentWord?.translation || 'No translation'}
        </p>
        {currentWord?.phonetic && (
          <p className="text-base text-gray-300 italic mt-1">
            /{currentWord.phonetic}/
          </p>
        )}
      </motion.div>

      <div className="flex items-center gap-3 mt-6 w-full">
        <Button
          variant="ghost"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="flex-1 py-3 text-sm font-medium bg-slate-700/50 hover:bg-slate-700 text-white border border-purple-400/30 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← Алдыңғы
        </Button>
        <Button
          variant="primary"
          onClick={handleListen}
          className="flex-1 py-3 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white border border-purple-400/50"
        >
          🔊 Тыңдау
        </Button>
        <Button
          variant="success"
          onClick={handleNext}
          className="flex-1 py-3 text-sm font-medium bg-green-600 hover:bg-green-700 text-white border border-green-400/50"
        >
          {currentIndex === words.length - 1 ? "Аяқтау ✓" : "Келесі →"}
        </Button>
      </div>
    </div>
  );
}

