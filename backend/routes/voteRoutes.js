const express = require("express");
const router = express.Router();
const voteController = require("../controllers/voteController");
const txDetailsHandler = typeof voteController.getTxDetails === "function"
  ? voteController.getTxDetails
  : (req, res) => res.status(503).json({
      success: false,
      message: "Transaction details handler unavailable"
    });

router.get("/parties", voteController.getParties);
router.get("/status", voteController.getVoteStatus);
router.get("/tx/:hash", txDetailsHandler);
router.post("/cast", voteController.castVote);
router.get("/results", voteController.getResults);

module.exports = router;
