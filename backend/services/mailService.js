// services/mailService.js
const nodemailer = require("nodemailer");

/**
 * Sends an email using the configured SMTP credentials or logs it to the console as a fallback.
 * @param {{ to: string, subject: string, html: string, text?: string }} options
 * @returns {Promise<boolean>} Resolves to true if sent via SMTP, false if console fallback.
 */
async function sendMail({ to, subject, html, text }) {
  const hasSmtp = process.env.SMTP_USER && process.env.SMTP_PASS;

  if (hasSmtp) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Smart Personalized Learning" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text: text || "Please check the HTML content of this email.",
      html,
    });
    return true;
  } else {
    console.log(`\n📧 [EMAIL FALLBACK] (No SMTP Configured)`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content:\n${text || html}\n`);
    return false;
  }
}

module.exports = { sendMail };
