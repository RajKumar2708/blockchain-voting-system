const User = require("../models/User");
const AllowedVoter = require("../models/AllowedVoter");
const transporter = require("../config/mail");
const faceapi = require("face-api.js");

const otpStore = new Map();

async function sendOtpEmail(to, otp) {
  const from = (process.env.EMAIL_FROM || process.env.EMAIL_USER || "").trim();
  const brevoApiKey = (process.env.BREVO_API_KEY || "").trim();

  if (brevoApiKey && from) {
    const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoApiKey
      },
      body: JSON.stringify({
        sender: { email: from, name: "Voting System" },
        to: [{ email: to }],
        subject: "Voting OTP",
        textContent: `Your OTP is ${otp}`
      })
    });

    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`Brevo API failed: ${resp.status} ${t}`);
    }
    const payload = await resp.json().catch(() => ({}));
    return {
      delivery: "brevo_api",
      messageId: payload.messageId || null
    };
  }

  await transporter.sendMail({
    from,
    to,
    subject: "Voting OTP",
    text: `Your OTP is ${otp}`
  });
  return {
    delivery: "smtp",
    messageId: null
  };
}

/* ===================== SEND OTP ===================== */
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = (email || "").trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const allowed = await AllowedVoter.findOne({ email: normalizedEmail });
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "Email not allowed to vote"
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    otpStore.set(normalizedEmail, otp);
    try {
      const sent = await sendOtpEmail(normalizedEmail, otp);

      return res.json({
        success: true,
        message: "OTP sent",
        delivery: sent.delivery,
        messageId: sent.messageId
      });
    } catch (mailErr) {
      // Fallback for environments where SMTP is blocked/times out.
      return res.json({
        success: true,
        message: "Email service unavailable. Use fallback OTP shown below.",
        otp: String(otp),
        delivery: "fallback"
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/* ===================== VERIFY OTP ===================== */
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  const normalizedEmail = (email || "").trim().toLowerCase();

  if (otpStore.get(normalizedEmail) != otp) {
    return res.status(400).json({
      success: false,
      message: "Invalid OTP"
    });
  }

  otpStore.delete(normalizedEmail);

  await User.findOneAndUpdate(
    { email: normalizedEmail },
    {
      otpVerified: true,
      allowedToVote: true
    },
    { upsert: true }
  );

  res.json({ success: true, message: "OTP verified" });
};

/* ===================== REGISTER FACE ===================== */
exports.registerFace = async (req, res) => {
  try {
    const { email, descriptor } = req.body;
    const normalizedEmail = (email || "").trim().toLowerCase();

    if (!descriptor || descriptor.length !== 128) {
      return res.status(400).json({
        success: false,
        message: "Invalid face descriptor"
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser && existingUser.faceRegistered) {
      return res.status(400).json({
        success: false,
        message: "Face already registered. Please login."
      });
    }

    if (!existingUser || !existingUser.allowedToVote || !existingUser.otpVerified) {
      return res.status(403).json({
        success: false,
        message: "OTP not verified or email not allowed"
      });
    }

    await User.findOneAndUpdate(
      { email: normalizedEmail },
      {
        faceDescriptor: descriptor,
        faceRegistered: true,
        faceVerified: false
      },
      { upsert: true }
    );

    res.json({
      success: true,
      message: "Face registered successfully"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

/* ===================== LOGIN WITH FACE ===================== */
exports.loginWithFace = async (req, res) => {
  try {
    const { email, descriptor } = req.body;
    const normalizedEmail = (email || "").trim().toLowerCase();

    if (!descriptor || descriptor.length !== 128) {
      return res.status(400).json({
        success: false,
        message: "Invalid face descriptor"
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !user.faceRegistered) {
      return res.status(403).json({
        success: false,
        message: "Face not registered"
      });
    }

    if (!user.allowedToVote || !user.otpVerified) {
      return res.status(403).json({
        success: false,
        message: "OTP not verified or email not allowed"
      });
    }

    const stored = new Float32Array(user.faceDescriptor);
    const incoming = new Float32Array(descriptor);

    const distance = faceapi.euclideanDistance(stored, incoming);
    console.log("FACE DISTANCE:", distance);

    const THRESHOLD = 0.35; // 🔒 STRICT

    if (distance > THRESHOLD) {
      return res.status(401).json({
        success: false,
        message: "Face does not match"
      });
    }

    user.faceVerified = true;
    await user.save();

    res.json({
      success: true,
      message: "Face matched. Login successful"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
