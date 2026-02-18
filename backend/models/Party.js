const mongoose = require("mongoose");

const partySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  leader: {
    type: String,
    required: true
  },
  partyIndex: {
    type: Number,
    unique: true,
    sparse: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Party", partySchema);
