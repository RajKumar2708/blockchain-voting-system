const Party = require("../models/Party");
const AllowedVoter = require("../models/AllowedVoter");
const Election = require("../models/Election");

async function ensurePartyIndexes() {
  const parties = await Party.find().sort({ createdAt: 1 });
  let nextIndex = 0;

  const used = new Set();
  parties.forEach(p => {
    if (Number.isInteger(p.partyIndex)) {
      used.add(p.partyIndex);
    }
  });

  for (const party of parties) {
    if (!Number.isInteger(party.partyIndex)) {
      while (used.has(nextIndex)) nextIndex++;
      party.partyIndex = nextIndex;
      used.add(nextIndex);
      nextIndex++;
      await party.save();
    }
  }
}

/* ================= PARTY ================= */

exports.createParty = async (req, res) => {
  try {
    const { name, leader } = req.body;

    if (!name || !leader) {
      return res.status(400).json({
        success: false,
        message: "Name and leader are required"
      });
    }

    await ensurePartyIndexes();
    const last = await Party.findOne()
      .sort({ partyIndex: -1 })
      .select("partyIndex");
    const nextIndex = Number.isInteger(last?.partyIndex) ? last.partyIndex + 1 : 0;

    const party = new Party({ name, leader, partyIndex: nextIndex });
    await party.save();

    res.json({
      success: true,
      message: "Party created successfully",
      party
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

exports.updateParty = async (req, res) => {
  try {
    const { name, leader } = req.body;
    const party = await Party.findByIdAndUpdate(
      req.params.id,
      { name, leader },
      { new: true }
    );

    if (!party) {
      return res.status(404).json({ success: false, message: "Party not found" });
    }

    res.json({ success: true, party });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

/* ================= ELECTION ================= */

exports.startElection = async (req, res) => {
  const election = await Election.findOne();
  if (election && election.active) {
    return res.json({ success: true, message: "Election already active" });
  }

  await Election.findOneAndUpdate(
    {},
    { active: true, startedAt: new Date(), endedAt: null },
    { upsert: true }
  );

  res.json({ success: true, message: "Election started" });
};

exports.endElection = async (req, res) => {
  await Election.findOneAndUpdate(
    {},
    { active: false, endedAt: new Date() },
    { upsert: true }
  );

  res.json({ success: true, message: "Election ended" });
};

exports.getElectionStatus = async (req, res) => {
  const election = await Election.findOne();
  res.json({
    success: true,
    active: Boolean(election?.active),
    startedAt: election?.startedAt || null,
    endedAt: election?.endedAt || null
  });
};

exports.resetSystem = async (req, res) => {
  try {
    await Election.findOneAndUpdate(
      {},
      { active: false, startedAt: null, endedAt: null },
      { upsert: true }
    );

    await AllowedVoter.deleteMany({});

    await Party.deleteMany({});

    await require("../models/User").updateMany(
      {},
      {
        $set: {
          otpVerified: false,
          faceRegistered: false,
          faceVerified: false,
          allowedToVote: false,
          hasVoted: false,
          voteTxHash: null,
          votedAt: null,
          votedPartyId: null,
          votedPartyIndex: null,
          faceDescriptor: []
        }
      }
    );

    res.json({ success: true, message: "System reset complete" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Reset failed",
      error: error.message
    });
  }
};

/* ================= ALLOWED VOTERS ================= */

// ADD EMAIL
exports.addAllowedVoter = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email required"
    });
  }

  try {
    const voter = await AllowedVoter.create({ email });
    res.json({ success: true, voter });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Email already exists"
    });
  }
};

// GET ALL EMAILS
exports.getAllowedVoters = async (req, res) => {
  const voters = await AllowedVoter.find();
  res.json(voters);
};

// REMOVE EMAIL
exports.removeAllowedVoter = async (req, res) => {
  await AllowedVoter.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Voter removed" });
};
