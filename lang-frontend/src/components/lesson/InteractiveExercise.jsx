import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../ui/Button";
import Badge from "../ui/Badge";

export default function InteractiveExercise({ exercise, onComplete }) {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleAnswer = (answer) => {
    setSelectedAnswer(answer);
    const correct = answer === exercise.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);
    
    if (correct && onComplete) {
      setTimeout(() => onComplete(), 1000);
    }
  };

  const handleReset = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(false);
  };

  const handleContinue = () => {
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Question */}
      <div className="mb-8 text-center w-full">
        <div className="bg-gradient-to-br from-slate-700/70 to-purple-800/70 rounded-xl p-6 border border-purple-400/40 shadow-lg">
          <h3 className="text-2xl font-semibold text-white leading-snug">
            {exercise?.question || 'No question'}
          </h3>
        </div>
      </div>
      
      {/* Answer Options */}
      <div className="space-y-3 w-full">
        {exercise.options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isCorrectOption = option === exercise.correctAnswer;
          
          return (
            <motion.button
              key={index}
              onClick={() => !showResult && handleAnswer(option)}
              disabled={showResult}
              className={`
                w-full text-left p-4 rounded-lg border-2 transition-all duration-200 text-base font-medium
                ${!showResult 
                  ? "border-purple-400/40 bg-slate-700/60 hover:border-purple-400 hover:bg-slate-700/80 cursor-pointer shadow-md hover:shadow-lg" 
                  : isSelected && isCorrect
                  ? "border-green-400 bg-green-800/50 shadow-lg"
                  : isSelected && !isCorrect
                  ? "border-red-400 bg-red-800/50 shadow-lg"
                  : isCorrectOption && showResult
                  ? "border-green-400 bg-green-800/50 shadow-lg"
                  : "border-purple-400/20 bg-slate-800/40"
                }
                ${showResult ? "cursor-default" : ""}
              `}
              whileHover={!showResult ? { scale: 1.01, y: -1 } : {}}
              whileTap={!showResult ? { scale: 0.99 } : {}}
            >
              <div className="flex items-center justify-between">
                <span className="text-white">{option}</span>
                {showResult && isSelected && (
                  <span className="text-xl">
                    {isCorrect ? (
                      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </span>
                )}
                {showResult && !isSelected && isCorrectOption && (
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Result Message */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 w-full"
          >
            {isCorrect ? (
              <div className="bg-green-800/50 border-2 border-green-400 rounded-xl p-5 flex items-center gap-4 shadow-lg">
                <div className="flex-1">
                  <p className="font-semibold text-green-300 text-lg mb-1">Дұрыс!</p>
                  {exercise.explanation && (
                    <p className="text-sm text-green-200">{exercise.explanation}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-red-800/50 border-2 border-red-400 rounded-xl p-5 flex items-center gap-4 shadow-lg">
                  <div className="flex-1">
                    <p className="font-semibold text-red-300 text-lg mb-1">Дұрыс емес</p>
                    <p className="text-sm text-red-200 mb-2">
                      Дұрыс жауап: <strong className="text-white">{exercise.correctAnswer}</strong>
                    </p>
                    {exercise.explanation && (
                      <p className="text-sm text-red-200">{exercise.explanation}</p>
                    )}
                  </div>
                </div>
                
                {/* Кнопки действий */}
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="ghost"
                    onClick={handleReset}
                    className="px-6 py-2.5 text-sm font-medium bg-slate-700/50 hover:bg-slate-700 text-white border border-purple-400/30"
                  >
                    Қайталау
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleContinue}
                    className="px-6 py-2.5 text-sm font-medium border border-purple-400/50"
                  >
                    Жалғастыру →
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

