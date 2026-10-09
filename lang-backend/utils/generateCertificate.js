const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Нормализует текст для правильного отображения в PDF
 * Убирает невидимые символы и исправляет кодировку
 */
function normalizeText(text) {
  if (!text) return '';
  
  // Преобразуем в строку, если это не строка
  let str = String(text);
  
  // Если это Buffer, декодируем в UTF-8
  if (Buffer.isBuffer(str)) {
    str = str.toString('utf8');
  }
  
  // Убираем невидимые символы
  str = str
    .replace(/\u0000/g, '') // Убираем null байты
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Убираем невидимые символы
    .trim();
  
  // Убеждаемся, что строка в правильной кодировке UTF-8
  // Если строка содержит неправильные байты, пытаемся исправить
  try {
    // Проверяем, что строка валидна в UTF-8
    const testBuffer = Buffer.from(str, 'utf8');
    str = testBuffer.toString('utf8');
  } catch (e) {
    // Если ошибка, пытаемся исправить через latin1 -> utf8
    try {
      // Если данные пришли в неправильной кодировке, пытаемся исправить
      const latinBuffer = Buffer.from(str, 'latin1');
      str = latinBuffer.toString('utf8');
    } catch (e2) {
      // Если и это не помогло, возвращаем как есть
      console.warn('Не удалось нормализовать текст:', str.substring(0, 50));
    }
  }
  
  return str;
}

/**
 * Получает путь к системному шрифту, поддерживающему Unicode
 * Возвращает null, если шрифт не найден
 */
function getUnicodeFontPath() {
  // Список возможных путей к шрифтам с поддержкой Unicode
  const possiblePaths = [
    // Windows
    'C:/Windows/Fonts/arial.ttf',
    'C:/Windows/Fonts/arialuni.ttf', // Arial Unicode MS
    'C:/Windows/Fonts/calibri.ttf',
    'C:/Windows/Fonts/times.ttf',
    // Linux
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    '/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf',
    // macOS
    '/System/Library/Fonts/Helvetica.ttc',
    '/Library/Fonts/Arial Unicode.ttf',
  ];
  
  for (const fontPath of possiblePaths) {
    if (fs.existsSync(fontPath)) {
      return fontPath;
    }
  }
  
  return null;
}

/**
 * Генерирует PDF сертификат
 * @param {Object} certificateData - Данные сертификата
 * @returns {Promise<Buffer>} - PDF файл в виде буфера
 */
async function generateCertificatePDF(certificateData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      doc.on('error', reject);

      // Нормализуем все текстовые данные
      const userName = normalizeText(certificateData.user_name || 'Student');
      const courseTitle = normalizeText(certificateData.course_title || 'Course');
      const testTitle = certificateData.test_title ? normalizeText(certificateData.test_title) : null;

      // Пытаемся найти шрифт с поддержкой Unicode
      const unicodeFontPath = getUnicodeFontPath();
      let hasUnicodeFont = false;
      
      // Если шрифт найден, загружаем его
      if (unicodeFontPath) {
        try {
          doc.registerFont('UnicodeFont', unicodeFontPath);
          hasUnicodeFont = true;
          
          // Пытаемся загрузить жирный вариант
          const boldFontPath = unicodeFontPath
            .replace(/arial\.ttf$/i, 'C:/Windows/Fonts/arialbd.ttf')
            .replace(/calibri\.ttf$/i, 'C:/Windows/Fonts/calibrib.ttf')
            .replace(/DejaVuSans\.ttf$/i, unicodeFontPath.replace('DejaVuSans', 'DejaVuSans-Bold'))
            .replace(/NotoSans-Regular\.ttf$/i, unicodeFontPath.replace('NotoSans-Regular', 'NotoSans-Bold'));
          
          if (fs.existsSync(boldFontPath)) {
            try {
              doc.registerFont('UnicodeFontBold', boldFontPath);
            } catch (e) {
              // Используем обычный шрифт для жирного текста
            }
          }
        } catch (e) {
          console.warn('Не удалось загрузить Unicode шрифт:', e.message);
          hasUnicodeFont = false;
        }
      }
      
      // Определяем шрифты для использования
      // PDFKit автоматически поддерживает Unicode через встроенные механизмы
      // Но для лучшей поддержки используем системные шрифты, если они доступны
      const defaultFont = hasUnicodeFont ? 'UnicodeFont' : 'Helvetica';
      const boldFont = hasUnicodeFont 
        ? (doc._registeredFonts && doc._registeredFonts['UnicodeFontBold'] ? 'UnicodeFontBold' : 'UnicodeFont') 
        : 'Helvetica-Bold';
      const obliqueFont = hasUnicodeFont ? 'UnicodeFont' : 'Helvetica-Oblique';

      // Фон с градиентом (симуляция)
      doc.rect(0, 0, doc.page.width, doc.page.height)
        .fillColor('#1e293b')
        .fill();

      // Декоративная рамка
      doc.strokeColor('#fbbf24')
        .lineWidth(8)
        .roundedRect(40, 40, doc.page.width - 80, doc.page.height - 80, 20)
        .stroke();

      // Внутренняя рамка
      doc.strokeColor('#f59e0b')
        .lineWidth(3)
        .roundedRect(60, 60, doc.page.width - 120, doc.page.height - 120, 15)
        .stroke();

      // Заголовок
      doc.fontSize(48)
        .fillColor('#fbbf24')
        .font(boldFont)
        .text('CERTIFICATE', {
          align: 'center',
          y: 120
        });

      // Подзаголовок
      doc.fontSize(18)
        .fillColor('#e5e7eb')
        .font(defaultFont)
        .text('This is to certify that', {
          align: 'center',
          y: 200
        });

      // Имя пользователя
      doc.fontSize(36)
        .fillColor('#ffffff')
        .font(boldFont)
        .text(userName, {
          align: 'center',
          y: 240
        });

      // Описание
      doc.fontSize(16)
        .fillColor('#cbd5e1')
        .font(defaultFont)
        .text('has successfully completed the course', {
          align: 'center',
          y: 300
        });

      // Название курса
      doc.fontSize(28)
        .fillColor('#fbbf24')
        .font(boldFont)
        .text(courseTitle, {
          align: 'center',
          y: 340,
          width: doc.page.width - 200, // Ограничиваем ширину для переноса
          ellipsis: false
        });

      // Если есть тест
      if (testTitle) {
        doc.fontSize(14)
          .fillColor('#94a3b8')
          .font(obliqueFont)
          .text(`Test: ${testTitle}`, {
            align: 'center',
            y: 390,
            width: doc.page.width - 200,
            ellipsis: false
          });
      }

      // Метаданные (результат)
      const metadata = certificateData.metadata 
        ? (typeof certificateData.metadata === 'string' 
          ? JSON.parse(certificateData.metadata) 
          : certificateData.metadata)
        : {};

      if (metadata.score !== undefined) {
        doc.fontSize(14)
          .fillColor('#e5e7eb')
          .font(defaultFont)
          .text(`Score: ${metadata.score}%`, {
            align: 'center',
            y: 420
          });
      }

      // Дата выдачи
      const issuedDate = new Date(certificateData.issued_at);
      const dateStr = issuedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      doc.fontSize(12)
        .fillColor('#94a3b8')
        .font(defaultFont)
        .text(`Issued on ${dateStr}`, {
          align: 'center',
          y: doc.page.height - 150
        });

      // Номер сертификата
      const certNumber = normalizeText(certificateData.certificate_number || '');
      doc.fontSize(10)
        .fillColor('#64748b')
        .font(defaultFont)
        .text(`Certificate Number: ${certNumber}`, {
          align: 'center',
          y: doc.page.height - 120
        });

      // Подпись и печать (симуляция)
      const signatureY = doc.page.height - 80;
      
      // Левая подпись
      doc.fontSize(10)
        .fillColor('#94a3b8')
        .font(defaultFont)
        .text('_________________', 150, signatureY)
        .fontSize(8)
        .text('Adenly Platform', 150, signatureY + 20);

      // Правая подпись
      doc.fontSize(10)
        .text('_________________', doc.page.width - 250, signatureY)
        .fontSize(8)
        .text('Date', doc.page.width - 250, signatureY + 20);

      // Декоративные элементы
      // Левый верхний угол
      doc.circle(100, 100, 30)
        .fillColor('#fbbf24')
        .fill();

      // Правый верхний угол
      doc.circle(doc.page.width - 100, 100, 30)
        .fill();

      // Левый нижний угол
      doc.circle(100, doc.page.height - 100, 30)
        .fill();

      // Правый нижний угол
      doc.circle(doc.page.width - 100, doc.page.height - 100, 30)
        .fill();

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateCertificatePDF };

