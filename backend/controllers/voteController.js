const Party = require("../models/Party");
const User = require("../models/User");
const Election = require("../models/Election");
const votingContract = require("../blockchain");

async function ensurePartyIndexes() {
  const parties = await Party.find().sort({ createdAt: 1 });
  let nextIndex = 0;

  const used = new Set();
  parties.forEach(p => {
    if (Number.isInteger(p.partyIndex)) used.add(p.partyIndex);
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

/* ================= GET ALL PARTIES ================= */
exports.getParties = async (req, res) => {
  try {
    await ensurePartyIndexes();
    const parties = await Party.find();
    res.json({
      success: true,
      parties
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

/* ================= USER VOTE STATUS ================= */
exports.getVoteStatus = async (req, res) => {
  try {
    const normalizedEmail = (req.query.email || "").trim().toLowerCase();
    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "Email query param is required"
      });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.json({
        success: true,
        exists: false,
        hasVoted: false,
        canVote: false,
        message: "User not found"
      });
    }

    const canVote = !!(user.allowedToVote && user.otpVerified && user.faceVerified && !user.hasVoted);
    return res.json({
      success: true,
      exists: true,
      hasVoted: !!user.hasVoted,
      canVote,
      message: user.hasVoted ? "You have already voted" : "Vote status loaded"
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to load vote status"
    });
  }
};

/* ================= CAST VOTE ================= */
exports.castVote = async (req, res) => {
  try {
    const { email, partyId } = req.body;
    const normalizedEmail = (email || "").trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (!user.allowedToVote || !user.otpVerified || !user.faceVerified) {
      return res.status(403).json({
        success: false,
        message: "You are not verified to vote"
      });
    }

    if (user.hasVoted) {
      return res.status(403).json({
        success: false,
        message: "You have already voted"
      });
    }

    const election = await Election.findOne();
    if (!election?.active) {
      return res.status(403).json({
        success: false,
        message: "Election is not active"
      });
    }

    await ensurePartyIndexes();
    const parties = await Party.find();
    const partyIndex = parties.findIndex(p => p._id.toString() === partyId);

    if (partyIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Party not found"
      });
    }

    const selectedParty = parties[partyIndex];
    if (!Number.isInteger(selectedParty.partyIndex)) {
      return res.status(500).json({
        success: false,
        message: "Party index not initialized"
      });
    }

    const tx = await votingContract.vote(selectedParty.partyIndex);
    await tx.wait();

    user.hasVoted = true;
    user.voteTxHash = tx.hash;
    user.votedAt = new Date();
    user.votedPartyId = selectedParty._id;
    user.votedPartyIndex = selectedParty.partyIndex;
    await user.save();

    res.json({
      success: true,
      message: "Your vote has been permanently recorded on blockchain",
      txHash: tx.hash
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Vote failed"
    });
  }
};

/* ================= GET RESULTS ================= */
exports.getResults = async (req, res) => {
  try {
    await ensurePartyIndexes();
    const parties = await Party.find();
    const voteLogs = await User.find({ hasVoted: true })
      .sort({ votedAt: -1 })
      .select("email voteTxHash votedAt votedPartyIndex");

    const votesByPartyIndex = {};
    voteLogs.forEach((log) => {
      const idx = Number(log.votedPartyIndex);
      if (Number.isInteger(idx)) {
        votesByPartyIndex[idx] = (votesByPartyIndex[idx] || 0) + 1;
      }
    });

    const results = await Promise.all(
      parties.map(async p => {
        const dbVotes = votesByPartyIndex[p.partyIndex] || 0;
        let chainVotes = 0;
        try {
          const count = await votingContract.getVotes(p.partyIndex);
          chainVotes = Number(count);
        } catch (e) {
          chainVotes = 0;
        }

        return {
          name: p.name,
          leader: p.leader,
          votes: Math.max(chainVotes, dbVotes)
        };
      })
    );

    res.json({
      success: true,
      results,
      logs: voteLogs
    });
  } catch (err) {
    res.status(500).json({
      success: false
    });
  }
};
