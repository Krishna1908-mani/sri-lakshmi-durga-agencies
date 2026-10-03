const { sendRawEmail } = require("../services/emailService");

/**
 * Backwards-compatible sendEmail wrapper
 */
const sendEmail = async ({ to, subject, html, text }) => {
  return sendRawEmail({ to, subject, html, text });
};

module.exports = sendEmail;