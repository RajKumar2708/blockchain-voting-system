const User = require("../models/User");

// Register face
exports.registerFace = async (req, res) => {
  const { email, descriptor } = req.body;

  const user = await User.findOne({ email });
  if (!user || !user.otpVerified) {
    return res.status(403).json({ error: "OTP not verified" });
  }

  user.faceDescriptor = descriptor;
  user.faceRegistered = true;
  await user.save();

  res.json({ message: "Face registered successfully" });
};

// Verify face
exports.verifyFace = async (req, res) => {
  const { email, descriptor } = req.body;

  const user = await User.findOne({ email });
  if (!user || !user.faceRegistered) {
    return res.status(404).json({ error: "Face not registered" });
  }

  const stored = user.faceDescriptor;
  let distance = 0;

  for (let i = 0; i < stored.length; i++) {
    distance += Math.pow(stored[i] - descriptor[i], 2);
  }
  distance = Math.sqrt(distance);

  if (distance < 0.45) {
    user.faceVerified = true;
    await user.save();
    return res.json({ verified: true });
  }

  res.status(401).json({ verified: false });
};
