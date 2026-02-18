const mongoose = require("mongoose");

const AllowedVoterSchema = new mongoose.Schema({
  email: { type: String, unique: true }
});

module.exports = mongoose.model("AllowedVoter", AllowedVoterSchema);
