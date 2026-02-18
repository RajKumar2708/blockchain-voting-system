const mongoose = require("mongoose");

const ElectionSchema = new mongoose.Schema({
  active: {
    type: Boolean,
    default: false
  },
  startedAt: Date,
  endedAt: Date
});

module.exports = mongoose.model("Election", ElectionSchema);
