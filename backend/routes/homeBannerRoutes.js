const express = require("express");
const multer = require("multer");
const path = require("path");

const rawSupabase = require("../config/supabase");
const supabase = rawSupabase.from ? rawSupabase : rawSupabase.supabase;
const { protectAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

/*
============================================================
MULTER MEMORY STORAGE FOR BANNER UPLOADS
Directly uploads to Supabase Storage: product-images/banners/
============================================================
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
      new Error("Only JPG, JPEG, PNG, WEBP and GIF images are allowed for banner"),
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
============================================================
HELPER: NORMALIZE BANNER
Supports both Supabase (id, created_at) and Mongo (_id, createdAt)
============================================================
*/

function normalizeBanner(banner) {
  if (!banner) return null;

  const rawId = banner.id !== undefined && banner.id !== null ? banner.id : banner._id;

  const smallText =
    banner.smallText !== undefined
      ? banner.smallText
      : banner.small_text !== undefined
      ? banner.small_text
      : "Welcome to Sri Lakshmi Durga Agencies";

  const title =
    banner.title || "Elegant Ladies Clothing & Essentials";

  const description =
    banner.description ||
    "Shop beautiful kurtis, dresses, tops, essentials and accessories at affordable prices.";

  const offerText =
    banner.offerText !== undefined
      ? banner.offerText
      : banner.offer_text !== undefined
      ? banner.offer_text
      : "Up to 40% OFF";

  const image = banner.image || "";

  const isActive =
    banner.isActive !== undefined
      ? Boolean(banner.isActive)
      : banner.is_active !== undefined
      ? Boolean(banner.is_active)
      : true;

  const createdAt = banner.created_at || banner.createdAt || null;
  const updatedAt = banner.updated_at || banner.updatedAt || null;

  return {
    ...banner,
    id: rawId,
    _id: rawId !== undefined ? String(rawId) : "",
    smallText,
    small_text: smallText,
    title,
    description,
    offerText,
    offer_text: offerText,
    image,
    isActive,
    is_active: isActive,
    created_at: createdAt,
    updated_at: updatedAt,
    createdAt,
    updatedAt,
  };
}

/*
============================================================
HELPER: UPLOAD BANNER TO SUPABASE STORAGE
Stored in: product-images/banners/<timestamp>-<random>-banner.ext
============================================================
*/

async function uploadBannerToSupabase(file) {
  const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
  const random = Math.random().toString(36).substring(2, 8);
  const destinationPath = `banners/${Date.now()}-${random}-banner${ext}`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(destinationPath, file.buffer, {
      contentType: file.mimetype,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage
    .from("product-images")
    .getPublicUrl(destinationPath);

  if (!data?.publicUrl) {
    throw new Error("Could not generate public banner image URL");
  }

  return {
    fileName: destinationPath,
    url: data.publicUrl,
  };
}

/*
============================================================
HELPER: SAFELY DELETE OLD BANNER IMAGE FROM STORAGE
Only removes if URL belongs to Supabase Storage bucket.
Ignores localhost and external URLs.
============================================================
*/

async function safelyDeleteSupabaseImage(imageUrl) {
  if (!imageUrl || typeof imageUrl !== "string") return false;

  const marker = "/storage/v1/object/public/product-images/";
  if (!imageUrl.includes(marker)) {
    // Localhost or external URL, ignore safely
    return false;
  }

  try {
    const filePath = imageUrl.split(marker)[1]?.split("?")[0];
    if (!filePath) return false;

    const { error } = await supabase.storage
      .from("product-images")
      .remove([filePath]);

    if (error) {
      console.warn("⚠️ Note while removing old Supabase banner image:", error.message);
      return false;
    }

    console.log("✅ Successfully purged old banner image from Supabase storage:", filePath);
    return true;
  } catch (err) {
    console.warn("⚠️ deleteSupabaseImage error:", err.message);
    return false;
  }
}

/*
============================================================
PUBLIC: GET HOME BANNER
Reads from Supabase first with fallback to MongoDB
============================================================
*/

router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("home_banners")
      .select("*")
      .eq("isActive", true)
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return res.json({
        success: true,
        banner: normalizeBanner(data),
      });
    }

    return res.json({
      success: true,
      banner: {
        id: 1,
        _id: "1",
        smallText: "Welcome to Sri Lakshmi Durga Agencies",
        title: "Elegant Ladies Clothing & Essentials",
        description: "Shop beautiful kurtis, dresses, tops, essentials and accessories at affordable prices.",
        offerText: "Up to 40% OFF",
        image: "",
        isActive: true,
      },
    });
  } catch (error) {
    console.error("GET /api/home-banner error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch home banner",
      error: error.message,
    });
  }
});

/*
============================================================
ADMIN: UPLOAD BANNER IMAGE
POST /api/home-banner/upload
============================================================
*/

router.post(
  "/upload",
  protectAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please select an image file to upload",
        });
      }

      const uploaded = await uploadBannerToSupabase(req.file);

      return res.status(201).json({
        success: true,
        message: "Banner image uploaded successfully to Supabase Storage",
        imageUrl: uploaded.url,
        url: uploaded.url,
        image: uploaded.url,
        path: uploaded.fileName,
      });
    } catch (error) {
      console.error("Banner image upload error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to upload banner image",
        error: error.message,
      });
    }
  }
);

/*
============================================================
ADMIN: UPDATE HOME BANNER
PUT /api/home-banner
============================================================
*/

router.put("/", protectAdmin, async (req, res) => {
  try {
    const payload = {
      smallText: req.body.smallText || "Welcome to Sri Lakshmi Durga Agencies",
      title: req.body.title || "Elegant Ladies Clothing & Essentials",
      description:
        req.body.description ||
        "Shop beautiful kurtis, dresses, tops, essentials and accessories at affordable prices.",
      offerText: req.body.offerText || "Up to 40% OFF",
      image: req.body.image || "",
      updated_at: new Date().toISOString(),
    };

    if (req.body.isActive !== undefined) {
      payload.isActive = Boolean(req.body.isActive);
    }

    // 1. Fetch existing Supabase banner to check for image replacement
    const { data: currentBanner, error: fetchErr } = await supabase
      .from("home_banners")
      .select("*")
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    let savedBanner = null;

    if (!fetchErr && currentBanner) {
      // Update existing Supabase row
      const { data: updated, error: updateErr } = await supabase
        .from("home_banners")
        .update(payload)
        .eq("id", currentBanner.id)
        .select("*")
        .single();

      if (updateErr) {
        console.error("Supabase banner update error:", updateErr.message);
        throw updateErr;
      }
      savedBanner = updated;
    } else {
      // Insert first row into Supabase
      payload.created_at = new Date().toISOString();
      const { data: inserted, error: insertErr } = await supabase
        .from("home_banners")
        .insert([payload])
        .select("*")
        .single();

      if (insertErr) {
        console.error("Supabase banner insert error:", insertErr.message);
        throw insertErr;
      }
      savedBanner = inserted;
    }

    // 2. OLD IMAGE CLEANUP:
    // Only after database update succeeded, if the previous image was replaced,
    // delete the old file from Supabase Storage.
    if (
      currentBanner?.image &&
      payload.image &&
      currentBanner.image !== payload.image
    ) {
      safelyDeleteSupabaseImage(currentBanner.image);
    }

    return res.json({
      success: true,
      message: "Home banner updated successfully",
      banner: normalizeBanner(savedBanner),
    });
  } catch (error) {
    console.error("PUT /api/home-banner error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update home banner",
      error: error.message,
    });
  }
});

/*
============================================================
ADMIN: DELETE / RESET HOME BANNER
DELETE /api/home-banner or DELETE /api/home-banner/:id
Hard deletes row and cleans up Supabase storage image.
============================================================
*/

router.delete("/", protectAdmin, async (req, res) => {
  try {
    // 1. Fetch current banner to get image path before deletion
    const { data: bannerToDelete } = await supabase
      .from("home_banners")
      .select("*")
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!bannerToDelete) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    // 2. Delete row from Supabase
    const { error: deleteErr } = await supabase
      .from("home_banners")
      .delete()
      .eq("id", bannerToDelete.id);

    if (deleteErr) {
      throw deleteErr;
    }

    // 3. After successful database deletion, delete Supabase Storage image
    if (bannerToDelete.image) {
      safelyDeleteSupabaseImage(bannerToDelete.image);
    }

    return res.json({
      success: true,
      message: "Banner deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/home-banner error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete banner",
      error: error.message,
    });
  }
});

module.exports = router;