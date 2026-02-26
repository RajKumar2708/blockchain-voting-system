const express = require("express");
const router = express.Router();
const voteController = require("../controllers/voteController");

router.get("/parties", voteController.getParties);
router.get("/status", voteController.getVoteStatus);
router.post("/cast", voteController.castVote);
router.get("/results", voteController.getResults);

module.exports = router;
