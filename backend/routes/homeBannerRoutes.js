const express = require("express");
const HomeBanner = require("../models/HomeBanner");
const { protectAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Public: get home banner
router.get("/", async (req, res) => {
  try {
    let banner = await HomeBanner.findOne();

    if (!banner) {
      banner = await HomeBanner.create({});
    }

    res.json({
      success: true,
      banner,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch home banner",
    });
  }
});

// Admin: update home banner
router.put("/", protectAdmin, async (req, res) => {
  try {
    const banner = await HomeBanner.findOneAndUpdate({}, req.body, {
      new: true,
      upsert: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: "Home banner updated successfully",
      banner,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update home banner",
      error: error.message,
    });
  }
});

module.exports = router;