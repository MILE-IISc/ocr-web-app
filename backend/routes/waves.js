const express = require("express");

const WaveController = require("../controllers/waves");

const checkAuth = require("../middleware/check-auth");
// const extractFile = require("../middleware/file"); extractFile, 

const router = express.Router();

router.post("", checkAuth, WaveController.createWaveList);

router.put("/:id", checkAuth, WaveController.updateTextGrid);

router.get("", WaveController.getWaveList);

// router.get("/:id", WaveController.getWave);

// router.delete("/:id", checkAuth, WaveController.deleteWave);

module.exports = router;
