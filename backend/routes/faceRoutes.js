const express = require("express");
const router = express.Router();

const {
  registerFace,
  verifyFace
} = require("../controllers/faceController");

router.post("/register", registerFace);
router.post("/verify", verifyFace);

module.exports = router;
