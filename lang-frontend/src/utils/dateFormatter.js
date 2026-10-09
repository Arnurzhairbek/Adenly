/**
 * Утилита для форматирования дат на казахском языке
 */

// Словарь названий месяцев на казахском
const monthsKZ = {
  0: 'қаңтар',
  1: 'ақпан',
  2: 'наурыз',
  3: 'сәуір',
  4: 'мамыр',
  5: 'маусым',
  6: 'шілде',
  7: 'тамыз',
  8: 'қыркүйек',
  9: 'қазан',
  10: 'қараша',
  11: 'желтоқсан'
};

// Словарь дней недели на казахском
const weekdaysKZ = {
  0: 'жексенбі',
  1: 'дүйсенбі',
  2: 'сейсенбі',
  3: 'сәрсенбі',
  4: 'бейсенбі',
  5: 'жұма',
  6: 'сенбі'
};

/**
 * Форматирует дату на казахском языке
 * @param {string|Date} dateString - Дата в виде строки или объекта Date
 * @param {object} options - Опции форматирования
 * @returns {string} - Отформатированная дата на казахском
 */
export function formatDateKZ(dateString, options = {}) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  const {
    includeTime = false,
    includeWeekday = false,
    shortMonth = false
  } = options;
  
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();
  const weekday = date.getDay();
  
  let formatted = '';
  
  if (includeWeekday) {
    formatted += weekdaysKZ[weekday] + ', ';
  }
  
  formatted += `${day} ${monthsKZ[month]}${shortMonth ? '.' : ''} ${year}`;
  
  if (includeTime) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    formatted += `, ${hours}:${minutes}`;
  }
  
  return formatted;
}

/**
 * Форматирует дату и время на казахском языке
 * @param {string|Date} dateString - Дата в виде строки или объекта Date
 * @returns {string} - Отформатированная дата и время
 */
export function formatDateTimeKZ(dateString) {
  return formatDateKZ(dateString, { includeTime: true });
}

/**
 * Форматирует дату с днем недели на казахском языке
 * @param {string|Date} dateString - Дата в виде строки или объекта Date
 * @returns {string} - Отформатированная дата с днем недели
 */
export function formatDateWithWeekdayKZ(dateString) {
  return formatDateKZ(dateString, { includeWeekday: true });
}

/**
 * Форматирует относительное время (например, "2 күн бұрын")
 * @param {string|Date} dateString - Дата в виде строки или объекта Date
 * @returns {string} - Относительное время на казахском
 */
export function formatRelativeTimeKZ(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  const now = new Date();
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);
  
  if (diffSeconds < 60) {
    return 'жаңа';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} минут бұрын`;
  } else if (diffHours < 24) {
    return `${diffHours} сағат бұрын`;
  } else if (diffDays < 7) {
    return `${diffDays} күн бұрын`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks} апта бұрын`;
  } else if (diffMonths < 12) {
    return `${diffMonths} ай бұрын`;
  } else {
    return `${diffYears} жыл бұрын`;
  }
}

