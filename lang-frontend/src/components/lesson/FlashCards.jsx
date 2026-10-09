import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../ui/Button";

export default function FlashCards({ cards, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completedCards, setCompletedCards] = useState(new Set());

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    setCompletedCards(new Set([...completedCards, currentIndex]));
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      if (onComplete) {
        onComplete();
      }
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative min-h-[300px] w-full cursor-pointer mb-6" onClick={handleFlip}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentIndex}-${isFlipped}`}
            initial={{ opacity: 0, rotateY: 90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: -90 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full min-h-[300px]"
          >
            {!isFlipped ? (
              <div className="w-full h-full min-h-[300px] bg-gradient-to-br from-slate-700 to-purple-800 rounded-xl shadow-lg border-2 border-purple-400 flex items-center justify-center p-10">
                <p className="text-3xl font-bold text-white text-center leading-snug">
                  {currentCard?.front || 'No card'}
                </p>
              </div>
            ) : (
              <div className="w-full h-full min-h-[300px] bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl shadow-lg border-2 border-purple-300 flex items-center justify-center p-10">
                <p className="text-2xl font-semibold text-white text-center leading-snug">
                  {currentCard?.back || 'No translation'}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

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
          onClick={handleFlip}
          className="flex-1 py-3 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white border border-purple-400/50"
        >
          {isFlipped ? "Сұрақ" : "Жауап"}
        </Button>
        <Button
          variant="success"
          onClick={handleNext}
          disabled={!isFlipped}
          className="flex-1 py-3 text-sm font-medium bg-green-600 hover:bg-green-700 text-white border border-green-400/50 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {currentIndex === cards.length - 1 ? "Аяқтау ✓" : "Келесі →"}
        </Button>
      </div>
    </div>
  );
}

