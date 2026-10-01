const express = require("express");
const multer = require("multer");
const path = require("path");

const supabase = require("../config/supabase");
const { protectAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

/*
===========================================================
MULTER MEMORY STORAGE
Files are kept in memory and uploaded directly to Supabase Storage
===========================================================
*/

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only JPG, JPEG, PNG, WEBP and GIF images are allowed"
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter,
});

/*
===========================================================
HELPER: CREATE SAFE FILE NAME
===========================================================
*/

function createFileName(originalName) {
  const extension = path.extname(originalName).toLowerCase();
  const baseName = path
    .basename(originalName, extension)
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();

  const random = Math.random().toString(36).substring(2, 8);
  return `products/${Date.now()}-${random}-${baseName}${extension}`;
}

/*
===========================================================
HELPER: UPLOAD ONE FILE TO SUPABASE STORAGE
===========================================================
*/

async function uploadToSupabase(file) {
  const fileName = createFileName(file.originalname);

  const { error } = await supabase.storage
    .from("product-images")
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage
    .from("product-images")
    .getPublicUrl(fileName);

  if (!data?.publicUrl) {
    throw new Error("Could not generate public image URL");
  }

  return {
    fileName,
    url: data.publicUrl,
  };
}

/*
===========================================================
CONTROLLERS
===========================================================
*/

// Controller for single image upload
const handleSingleUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image to upload",
      });
    }

    const uploadedImage = await uploadToSupabase(req.file);

    return res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      url: uploadedImage.url,
      imageUrl: uploadedImage.url,
      image: uploadedImage.url,
      path: uploadedImage.fileName,
    });
  } catch (error) {
    console.error("Supabase image upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload image",
      error: error.message,
    });
  }
};

// Controller for multiple gallery images upload
const handleMultipleUpload = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one image to upload",
      });
    }

    const uploadedImages = await Promise.all(
      req.files.map((file) => uploadToSupabase(file))
    );

    const urls = uploadedImages.map((item) => item.url);

    return res.status(201).json({
      success: true,
      message: "Gallery images uploaded successfully",
      urls,
      imageUrls: urls, // Expected by AddProduct.jsx and EditProduct.jsx
      images: urls,
      files: uploadedImages.map((item) => ({
        url: item.url,
        path: item.fileName,
      })),
    });
  } catch (error) {
    console.error("Supabase multiple upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload images",
      error: error.message,
    });
  }
};

/*
===========================================================
ROUTES
Support both existing frontend routes and standard aliases
===========================================================
*/

// 1. Existing Frontend endpoints called by AddProduct.jsx and EditProduct.jsx
router.post(
  "/product-image",
  protectAdmin,
  upload.single("image"),
  handleSingleUpload
);

router.post(
  "/product-images",
  protectAdmin,
  upload.array("images", 10),
  handleMultipleUpload
);

// 2. Standard Aliases
router.post(
  "/single",
  protectAdmin,
  upload.single("image"),
  handleSingleUpload
);

router.post(
  "/multiple",
  protectAdmin,
  upload.array("images", 10),
  handleMultipleUpload
);

router.post(
  "/",
  protectAdmin,
  upload.single("image"),
  handleSingleUpload
);

router.post(
  "/banner",
  protectAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "Please select an image" });
      }
      const ext = path.extname(req.file.originalname).toLowerCase() || ".jpg";
      const random = Math.random().toString(36).substring(2, 8);
      const destinationPath = `banners/${Date.now()}-${random}-banner${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(destinationPath, req.file.buffer, {
          contentType: req.file.mimetype,
          cacheControl: "3600",
          upsert: false,
        });
      if (uploadError) throw new Error(uploadError.message);
      const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(destinationPath);
      return res.status(201).json({
        success: true,
        message: "Banner image uploaded successfully",
        imageUrl: publicUrlData.publicUrl,
        url: publicUrlData.publicUrl,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Upload failed", error: err.message });
    }
  }
);

/*
===========================================================
MULTER ERROR HANDLER
===========================================================
*/

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Image must be smaller than 10 MB",
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  next();
});

module.exports = router;