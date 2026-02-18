const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true
  },

  otp: String,
  otpVerified: {
    type: Boolean,
    default: false
  },

  faceDescriptor: {
    type: [Number], // 128-length descriptor
    default: []
  },

  faceRegistered: {
    type: Boolean,
    default: false
  },

  faceVerified: {
    type: Boolean,
    default: false
  },

  allowedToVote: {
    type: Boolean,
    default: false
  },

  hasVoted: {
    type: Boolean,
    default: false
  },
  voteTxHash: String,
  votedAt: Date,
  votedPartyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Party"
  },
  votedPartyIndex: Number,

  role: {
    type: String,
    enum: ["client", "admin"],
    default: "client"
  }
});

module.exports = mongoose.model("User", UserSchema);
