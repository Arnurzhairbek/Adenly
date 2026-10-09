const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendMail(to, subject, text, html) {
  try {
    await transporter.sendMail({
      from: `"LangApp" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    });
    console.log(`📧 Письмо отправлено на ${to}`);
  } catch (error) {
    console.error('Ошибка при отправке письма:', error);
  }
}

module.exports = { sendMail };
