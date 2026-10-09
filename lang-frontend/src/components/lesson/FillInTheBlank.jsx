import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../ui/Button";

export default function FillInTheBlank({ exercise, onComplete }) {
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswerChange = (blankIndex, value) => {
    setAnswers({ ...answers, [blankIndex]: value });
  };

  const handleCheck = () => {
    let correct = 0;
    exercise.blanks.forEach((blank, index) => {
      const userAnswer = answers[index]?.toLowerCase().trim();
      const correctAnswer = blank.correct.toLowerCase().trim();
      if (userAnswer === correctAnswer) {
        correct++;
      }
    });
    
    setScore(correct);
    setShowResult(true);
    
    if (correct === exercise.blanks.length && onComplete) {
      setTimeout(() => onComplete(), 1500);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setShowResult(false);
    setScore(0);
  };

  const renderText = () => {
    const parts = exercise.text.split(/(___\d+___)/);
    let blankIndex = 0;
    
    return parts.map((part, index) => {
      if (part.match(/^___\d+___$/)) {
        const currentIndex = blankIndex;
        blankIndex++;
        const blank = exercise.blanks[currentIndex];
        const userAnswer = answers[currentIndex] || "";
        const isCorrect = showResult && userAnswer.toLowerCase().trim() === blank.correct.toLowerCase().trim();
        
        return (
          <span key={index} className="inline-block mx-1">
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => handleAnswerChange(currentIndex, e.target.value)}
              disabled={showResult}
              className={`
                inline-block w-28 px-3 py-2 rounded-lg border-2 text-center font-semibold text-base
                ${showResult 
                  ? isCorrect 
                    ? "border-green-400 bg-green-100 text-green-800" 
                    : "border-red-400 bg-red-100 text-red-800"
                  : "border-purple-400/40 bg-slate-600/60 text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                }
                disabled:cursor-not-allowed
              `}
              placeholder="?"
            />
            {showResult && !isCorrect && (
              <span className="ml-1 text-sm text-red-300 font-medium">
                ({blank.correct})
              </span>
            )}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="w-full">
      <div className="bg-slate-700/60 rounded-xl p-8 mb-6 border border-purple-400/40 shadow-lg min-h-[250px] flex items-center justify-center">
        <p className="text-xl leading-relaxed text-white text-center font-medium">
          {renderText()}
        </p>
      </div>

      {!showResult ? (
        <div className="flex justify-center mt-6">
          <Button
            variant="primary"
            onClick={handleCheck}
            disabled={Object.keys(answers).length < exercise.blanks.length}
            className="px-8 py-3 text-base font-medium border border-purple-400/50"
          >
            Жауаптарды тексеру ✓
          </Button>
        </div>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 w-full mt-6"
          >
            <div className={`
              rounded-xl p-6 border-2 shadow-lg text-center
              ${score === exercise.blanks.length 
                ? "bg-green-800/50 border-green-400" 
                : "bg-amber-800/50 border-amber-400"
              }
            `}>
              <p className="font-semibold text-xl text-white">
                {score === exercise.blanks.length ? (
                  <>Керемет! Барлығы дұрыс!</>
                ) : (
                  <>{score} / {exercise.blanks.length} дұрыс</>
                )}
              </p>
            </div>
            <div className="flex justify-center">
              <Button
                variant="ghost"
                onClick={handleReset}
                className="px-8 py-3 text-base font-medium bg-slate-700/50 hover:bg-slate-700 text-white border border-purple-400/30"
              >
                  Қайталау
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

