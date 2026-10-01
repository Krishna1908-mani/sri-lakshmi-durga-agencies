const express = require("express");
const Coupon = require("../models/Coupon");
const { protectAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Public: validate coupon
router.post("/validate", async (req, res) => {
  try {
    const { code, totalAmount } = req.body;

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid coupon code",
      });
    }

    if (totalAmount < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount should be ₹${coupon.minOrderAmount}`,
      });
    }

    let discountAmount = 0;

    if (coupon.discountType === "PERCENT") {
      discountAmount = Math.round((totalAmount * coupon.discountValue) / 100);
    } else {
      discountAmount = coupon.discountValue;
    }

    if (discountAmount > totalAmount) {
      discountAmount = totalAmount;
    }

    res.json({
      success: true,
      message: "Coupon applied successfully",
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Coupon validation failed",
    });
  }
});

// Admin: create coupon
router.post("/", protectAdmin, async (req, res) => {
  try {
    const coupon = await Coupon.create({
      code: req.body.code.toUpperCase(),
      discountType: req.body.discountType,
      discountValue: req.body.discountValue,
      minOrderAmount: req.body.minOrderAmount,
    });

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to create coupon",
      error: error.message,
    });
  }
});

// Admin: get all coupons
router.get("/", protectAdmin, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      coupons,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch coupons",
    });
  }
});

// Admin: delete coupon
router.delete("/:id", protectAdmin, async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete coupon",
    });
  }
});

module.exports = router;