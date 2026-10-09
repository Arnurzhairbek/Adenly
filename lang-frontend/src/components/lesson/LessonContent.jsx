import { useState } from "react";
import { motion } from "framer-motion";

export default function LessonContent({ content, language = 'en-US' }) {
  const [playingIndex, setPlayingIndex] = useState(null);

  if (!content || !content.trim()) return null;

  const speak = (text, index) => {
    if ('speechSynthesis' in window) {
      // Останавливаем предыдущее воспроизведение
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.85;
      utterance.pitch = 1;
      
      utterance.onstart = () => setPlayingIndex(index);
      utterance.onend = () => setPlayingIndex(null);
      utterance.onerror = () => setPlayingIndex(null);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const parseContent = () => {
    const lines = content.split('\n');
    const sections = [];
    let currentSection = { type: 'intro', content: [], title: null };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      
      if (!trimmed) {
        return; // Пропускаем пустые строки
      }

      // Заголовки секций
      if (trimmed.endsWith(':') && trimmed.length < 50 && !trimmed.startsWith('-')) {
        if (currentSection.content.length > 0 || currentSection.title) {
          sections.push(currentSection);
        }
        currentSection = {
          type: trimmed.includes('Примеры') || trimmed.includes('Практика') ? 'examples' : 'phrases',
          content: [],
          title: trimmed
        };
      }
      // Фразы с переводом
      else if (trimmed.startsWith('-') && trimmed.includes(' - ')) {
        const withoutDash = trimmed.substring(1).trim();
        const parts = withoutDash.split(' - ');
        if (parts.length >= 2) {
          currentSection.content.push({
            type: 'phrase',
            original: parts[0].trim(),
            translation: parts.slice(1).join(' - ').trim()
          });
        }
      }
      // Обычный текст
      else {
        currentSection.content.push({
          type: 'text',
          text: trimmed
        });
      }
    });

    if (currentSection.content.length > 0 || currentSection.title) {
      sections.push(currentSection);
    }

    return sections;
  };

  const sections = parseContent();

  return (
    <div className="pl-6 mb-8 space-y-6">
      {sections.map((section, sectionIdx) => (
        <motion.div
          key={sectionIdx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: sectionIdx * 0.1 }}
        >
          {/* Заголовок секции */}
          {section.title && (
            <h3 className="text-2xl font-bold text-brand-400 mb-4">
              {section.title}
            </h3>
          )}

          {/* Контент секции */}
          <div className="space-y-3">
            {section.content.map((item, itemIdx) => {
              if (item.type === 'phrase') {
                const globalIndex = `${sectionIdx}-${itemIdx}`;
                const isPlaying = playingIndex === globalIndex;

                return (
                  <motion.div
                    key={itemIdx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: itemIdx * 0.05 }}
                    whileHover={{ scale: 1.02, translateX: 4 }}
                    className={`
                      group relative bg-gradient-to-br from-brand-700/60 via-brand-600/50 to-primary-600/40 
                      rounded-xl p-5 border border-brand-400/40 shadow-md
                      hover:shadow-xl hover:border-brand-300/60 transition-all duration-300
                      ${isPlaying ? 'ring-2 ring-brand-400 shadow-brand-500/50' : ''}
                    `}
                  >
                    <div className="flex items-center gap-4">
                      {/* Кнопка воспроизведения */}
                      <button
                        onClick={() => speak(item.original, globalIndex)}
                        className={`
                          flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
                          transition-all duration-200
                          ${isPlaying 
                            ? 'bg-brand-500 text-white shadow-lg scale-110' 
                            : 'bg-brand-600/40 text-brand-300 hover:bg-brand-500 hover:text-white group-hover:scale-105'
                          }
                        `}
                      >
                        {isPlaying ? (
                          <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                          </svg>
                        )}
                      </button>

                      {/* Фразы */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          {/* Оригинал */}
                          <div className="flex-1">
                            <p className="text-lg font-semibold text-white leading-snug">
                              {item.original}
                            </p>
                          </div>
                          
                          {/* Разделитель */}
                          <div className="hidden sm:block w-px h-8 bg-brand-400/40"></div>
                          
                          {/* Перевод */}
                          <div className="flex-1">
                            <p className="text-base text-gray-300 leading-snug">
                              {item.translation}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Иконка наведения */}
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    </div>
                  </motion.div>
                );
              } else if (item.type === 'text') {
                return (
                  <div
                    key={itemIdx}
                    className="bg-brand-700/30 rounded-lg p-4 border border-brand-400/30"
                  >
                    <p className="text-gray-200 text-base leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

