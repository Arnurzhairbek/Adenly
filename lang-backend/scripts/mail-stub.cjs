// CI substitutes only the external mail service; PostgreSQL and HTTP remain real.
if (process.env.NODE_ENV !== 'test') throw new Error('Mail stub is only for tests');
require('../utils/mailer').sendMail = async () => {};
