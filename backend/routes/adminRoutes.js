const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

/* PARTY */
router.post("/party", adminController.createParty);
router.put("/party/:id", adminController.updateParty);

/* ELECTION */
router.post("/start", adminController.startElection);
router.post("/end", adminController.endElection);
router.get("/status", adminController.getElectionStatus);
router.post("/reset", adminController.resetSystem);

/* ALLOWED VOTERS */
router.post("/allow-voter", adminController.addAllowedVoter);
router.get("/allowed-voters", adminController.getAllowedVoters);
router.delete("/remove-voter/:id", adminController.removeAllowedVoter);

const Party = require("../models/Party");

/* GET ALL PARTIES */
router.get("/parties", async (req, res) => {
  const parties = await Party.find();
  res.json(parties);
});

/* DELETE PARTY */
router.delete("/party/:id", async (req, res) => {
  await Party.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Party deleted" });
});


module.exports = router;
