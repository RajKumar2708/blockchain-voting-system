const nodemailer = require("nodemailer");

const SMTP_HOST = (process.env.SMTP_HOST || "").trim();
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
const SMTP_USER = (process.env.SMTP_USER || process.env.EMAIL_USER || "").trim();
const SMTP_PASS = (process.env.SMTP_PASS || process.env.EMAIL_PASS || "").replace(/\s+/g, "");

const transporter = nodemailer.createTransport({
  ...(SMTP_HOST
    ? { host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_SECURE }
    : { service: "gmail" }),
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
});

module.exports = transporter;
