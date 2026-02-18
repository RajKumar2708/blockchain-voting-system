const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

/* OTP */
router.post("/send-otp", authController.sendOtp);
router.post("/verify-otp", authController.verifyOtp);

/* FACE */
router.post("/register-face", authController.registerFace);
router.post("/login-face", authController.loginWithFace);

module.exports = router;
