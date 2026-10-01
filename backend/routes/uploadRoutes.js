const express = require("express");
const { protectAdmin } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// Upload single product image
router.post(
  "/product-image",
  protectAdmin,
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Image upload failed",
        });
      }
      next();
    });
  },
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image uploaded",
        });
      }

      const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${
        req.file.filename
      }`;

      res.json({
        success: true,
        message: "Image uploaded successfully",
        imageUrl,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Image upload failed",
      });
    }
  }
);

// Upload multiple gallery images
router.post(
  "/product-images",
  protectAdmin,
  (req, res, next) => {
    upload.array("images", 8)(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Gallery image upload failed",
        });
      }
      next();
    });
  },
  (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No images uploaded",
        });
      }

      const imageUrls = req.files.map(
        (file) =>
          `${req.protocol}://${req.get("host")}/uploads/${file.filename}`
      );

      res.json({
        success: true,
        message: "Gallery images uploaded successfully",
        imageUrls,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gallery image upload failed",
      });
    }
  }
);

module.exports = router;