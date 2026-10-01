const express = require("express");
const supabase = require("../config/supabase");
const { protectAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

function normalizeCoupon(c) {
  if (!c) return null;
  const rawId = c.id !== undefined && c.id !== null ? c.id : c._id;
  return {
    _id: String(rawId),
    id: rawId,
    code: String(c.code || "").toUpperCase(),
    discountType: c.discountType || "PERCENT",
    discountValue: Number(c.discountValue) || 0,
    minOrderAmount: Number(c.minOrderAmount) || 0,
    isActive: c.isActive !== undefined ? Boolean(c.isActive) : true,
    createdAt: c.created_at || c.createdAt || null,
    updatedAt: c.updated_at || c.updatedAt || null,
  };
}

// Public: validate coupon
router.post("/validate", async (req, res) => {
  try {
    const { code, totalAmount } = req.body;

    if (!code || totalAmount === undefined) {
      return res.status(400).json({
        success: false,
        message: "Coupon code and total amount are required",
      });
    }

    const upperCode = String(code).trim().toUpperCase();

    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", upperCode)
      .eq("isActive", true)
      .maybeSingle();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: "Invalid coupon code",
      });
    }

    const coupon = normalizeCoupon(data);
    const orderTotal = Number(totalAmount) || 0;

    if (orderTotal < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount should be ₹${coupon.minOrderAmount}`,
      });
    }

    let discountAmount = 0;

    if (coupon.discountType === "PERCENT") {
      discountAmount = Math.round((orderTotal * coupon.discountValue) / 100);
    } else {
      discountAmount = coupon.discountValue;
    }

    if (discountAmount > orderTotal) {
      discountAmount = orderTotal;
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
    console.error("Coupon validation error:", error);
    res.status(500).json({
      success: false,
      message: "Coupon validation failed",
    });
  }
});

// Admin: create coupon
router.post("/", protectAdmin, async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrderAmount } = req.body;

    if (!code || discountValue === undefined) {
      return res.status(400).json({
        success: false,
        message: "Coupon code and discount value are required",
      });
    }

    const upperCode = String(code).trim().toUpperCase();
    const type = discountType === "FLAT" ? "FLAT" : "PERCENT";
    const value = Number(discountValue) || 0;
    const minOrder = Number(minOrderAmount) || 0;

    const { data, error } = await supabase
      .from("coupons")
      .insert({
        code: upperCode,
        discountType: type,
        discountValue: value,
        minOrderAmount: minOrder,
        isActive: true,
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to create coupon",
      });
    }

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon: normalizeCoupon(data),
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create coupon",
    });
  }
});

// Admin: get all coupons
router.get("/", protectAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch coupons",
      });
    }

    const coupons = (data || []).map(normalizeCoupon);

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

// Admin: update coupon
router.put("/:id", protectAdmin, async (req, res) => {
  try {
    const rawId = req.params.id;
    const numericId = Number(rawId);

    if (!Number.isInteger(numericId) || numericId <= 0) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    const updates = {};
    if (req.body.code) updates.code = String(req.body.code).trim().toUpperCase();
    if (req.body.discountType) updates.discountType = req.body.discountType === "FLAT" ? "FLAT" : "PERCENT";
    if (req.body.discountValue !== undefined) updates.discountValue = Number(req.body.discountValue);
    if (req.body.minOrderAmount !== undefined) updates.minOrderAmount = Number(req.body.minOrderAmount);
    if (req.body.isActive !== undefined) updates.isActive = Boolean(req.body.isActive);

    const { data, error } = await supabase
      .from("coupons")
      .update(updates)
      .eq("id", numericId)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    res.json({
      success: true,
      message: "Coupon updated successfully",
      coupon: normalizeCoupon(data),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update coupon",
    });
  }
});

// Admin: delete coupon
router.delete("/:id", protectAdmin, async (req, res) => {
  try {
    const rawId = req.params.id;
    const numericId = Number(rawId);

    if (Number.isInteger(numericId) && numericId > 0) {
      await supabase.from("coupons").delete().eq("id", numericId);
    }

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