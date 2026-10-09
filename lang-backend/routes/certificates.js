const express = require('express');
const router = express.Router();
const pool = require('../db/db');
const authMiddleware = require('../middleware/authMiddleware');
const logger = require('../utils/logger');
const { generateCertificatePDF } = require('../utils/generateCertificate');

// 🎓 Получить все сертификаты пользователя
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const certificates = await pool.query(`
      SELECT 
        c.*,
        co.title as course_title,
        co.description as course_description,
        t.title as test_title
      FROM certificates c
      JOIN courses co ON c.course_id = co.id
      LEFT JOIN tests t ON c.test_id = t.id
      WHERE c.user_id = $1
      ORDER BY c.issued_at DESC
    `, [userId]);

    res.json(certificates.rows);
  } catch (err) {
    logger.error('Ошибка при получении сертификатов', { error: err });
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

// 🎓 Получить конкретный сертификат
router.get('/:certificateId', authMiddleware, async (req, res) => {
  try {
    const { certificateId } = req.params;
    const userId = req.user.id;

    const certificate = await pool.query(`
      SELECT 
        c.*,
        u.name as user_name,
        u.email as user_email,
        co.title as course_title,
        co.description as course_description,
        t.title as test_title
      FROM certificates c
      JOIN users u ON c.user_id = u.id
      JOIN courses co ON c.course_id = co.id
      LEFT JOIN tests t ON c.test_id = t.id
      WHERE c.id = $1 AND c.user_id = $2
    `, [certificateId, userId]);

    if (certificate.rows.length === 0) {
      return res.status(404).json({ message: 'Сертификат не найден' });
    }

    res.json(certificate.rows[0]);
  } catch (err) {
    logger.error('Ошибка при получении сертификата', { error: err });
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

// 🔍 Проверить сертификат по номеру (публичный эндпоинт)
router.get('/verify/:certificateNumber', async (req, res) => {
  try {
    const { certificateNumber } = req.params;

    const certificate = await pool.query(`
      SELECT 
        c.*,
        u.name as user_name,
        co.title as course_title,
        t.title as test_title
      FROM certificates c
      JOIN users u ON c.user_id = u.id
      JOIN courses co ON c.course_id = co.id
      LEFT JOIN tests t ON c.test_id = t.id
      WHERE c.certificate_number = $1
    `, [certificateNumber]);

    if (certificate.rows.length === 0) {
      return res.status(404).json({ 
        valid: false,
        message: 'Сертификат не найден' 
      });
    }

    const cert = certificate.rows[0];
    const isValid = !cert.expires_at || new Date(cert.expires_at) > new Date();

    res.json({
      valid: isValid,
      certificate: {
        id: cert.id,
        certificate_number: cert.certificate_number,
        user_name: cert.user_name,
        course_title: cert.course_title,
        test_title: cert.test_title,
        issued_at: cert.issued_at,
        expires_at: cert.expires_at
      }
    });
  } catch (err) {
    logger.error('Ошибка при проверке сертификата', { error: err });
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

// 📥 Скачать сертификат в формате PDF
router.get('/:certificateId/download', authMiddleware, async (req, res) => {
  try {
    const { certificateId } = req.params;
    const userId = req.user.id;

    // Устанавливаем кодировку UTF-8 для этого запроса
    await pool.query('SET client_encoding TO UTF8');
    
    const certificate = await pool.query(`
      SELECT 
        c.*,
        u.name as user_name,
        u.email as user_email,
        co.title as course_title,
        co.description as course_description,
        t.title as test_title
      FROM certificates c
      JOIN users u ON c.user_id = u.id
      JOIN courses co ON c.course_id = co.id
      LEFT JOIN tests t ON c.test_id = t.id
      WHERE c.id = $1 AND c.user_id = $2
    `, [certificateId, userId]);

    if (certificate.rows.length === 0) {
      return res.status(404).json({ message: 'Сертификат не найден' });
    }

    const certData = certificate.rows[0];
    
    // Логируем данные для отладки (только в dev режиме)
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Данные сертификата для PDF', {
        course_title: certData.course_title,
        test_title: certData.test_title,
        user_name: certData.user_name,
        course_title_type: typeof certData.course_title,
        course_title_length: certData.course_title?.length
      });
    }
    
    // Генерируем PDF
    const pdfBuffer = await generateCertificatePDF(certData);

    // Устанавливаем заголовки для скачивания
    const fileName = `Certificate_${certData.certificate_number.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
    
    logger.info('Сертификат скачан', { certificateId, userId });
  } catch (err) {
    logger.error('Ошибка при генерации PDF сертификата', { error: err });
    res.status(500).json({ message: 'Ошибка сервера при генерации PDF', error: err.message });
  }
});

module.exports = router;

