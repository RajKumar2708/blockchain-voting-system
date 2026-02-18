const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: (process.env.EMAIL_USER || "").trim(),
    pass: (process.env.EMAIL_PASS || "").replace(/\s+/g, "")
  }
});

module.exports = transporter;
