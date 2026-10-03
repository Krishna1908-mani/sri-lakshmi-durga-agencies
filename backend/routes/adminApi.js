const express = require("express");
const router = express.Router();

const {
  requireAdminAuth,
  strictAdminOriginGuard,
} = require("../middleware/authMiddleware");

// Import core route handlers
const authRoutes = require("./authRoutes");
const productRoutes = require("./productRoutes");
const orderRoutes = require("./orderRoutes");
const couponRoutes = require("./couponRoutes");
const homeBannerRoutes = require("./homeBannerRoutes");
const uploadRoutes = require("./uploadRoutes");

/**
 * ============================================================================
 * SRI LAKSHMI DURGA AGENCIES — ADMINISTRATOR NAMESPACED API (/api/v1/admin)
 * Strictly isolated for store management, catalog control, finances, & assets.
 * Enforces origin blocking against customer clients and strict admin auth.
 * ============================================================================
 */

// Layer 1: Strict Admin Origin Guard (blocks requests bearing Customer Origin headers)
router.use(strictAdminOriginGuard);

// Layer 2: Public Admin Authentication (Login Only)
router.post("/auth/login", (req, res, next) => {
  // Delegate to authRoutes /admin/login handler
  req.url = "/admin/login";
  authRoutes(req, res, next);
});

router.post("/auth/logout", (req, res, next) => {
  req.url = "/admin/logout";
  authRoutes(req, res, next);
});

// Layer 3: All remaining routes require strict Administrator verification
router.use(requireAdminAuth);

// Admin Session Profile & Settings
router.get("/auth/me", (req, res, next) => {
  req.url = "/admin/me";
  authRoutes(req, res, next);
});

router.put("/auth/update-profile", (req, res, next) => {
  req.url = "/admin/update-profile";
  authRoutes(req, res, next);
});

// Admin Resource Management
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);
router.use("/coupons", couponRoutes);
router.use("/banners", homeBannerRoutes);
router.use("/upload", uploadRoutes);

module.exports = router;
