const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

// Load backend/.env
dotenv.config({ path: path.join(__dirname, "../.env") });

const rawSupabase = require("../config/supabase");
const supabase = rawSupabase.from ? rawSupabase : rawSupabase.supabase;
const HomeBanner = require("../models/HomeBanner");

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    default:
      return "image/jpeg";
  }
}

async function uploadLocalImageToSupabase(localUrlOrFilename) {
  try {
    if (!localUrlOrFilename || typeof localUrlOrFilename !== "string") {
      return "";
    }

    // Already on Supabase? Return as is
    if (localUrlOrFilename.includes("/storage/v1/object/public/product-images/")) {
      return localUrlOrFilename;
    }

    // Extract filename from URL (e.g. http://localhost:5000/uploads/1781106397288-516778558.jpg)
    let fileName = localUrlOrFilename;
    if (localUrlOrFilename.includes("/uploads/")) {
      fileName = localUrlOrFilename.split("/uploads/")[1]?.split("?")[0];
    } else {
      fileName = path.basename(localUrlOrFilename);
    }

    if (!fileName) return localUrlOrFilename;

    const localFilePath = path.join(__dirname, "../uploads", fileName);

    if (!fs.existsSync(localFilePath)) {
      console.warn(`⚠️ Local banner file not found on disk at ${localFilePath}. Keeping original URL.`);
      return localUrlOrFilename;
    }

    const fileBuffer = fs.readFileSync(localFilePath);
    const mimeType = getMimeType(localFilePath);
    const ext = path.extname(fileName) || ".jpg";
    const random = Math.random().toString(36).substring(2, 8);
    const destinationPath = `banners/${Date.now()}-${random}-banner${ext}`;

    console.log(`Uploading local banner image ${fileName} -> Supabase Storage (${destinationPath})...`);

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(destinationPath, fileBuffer, {
        contentType: mimeType,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.warn("⚠️ Failed to upload image to Supabase Storage:", uploadError.message);
      return localUrlOrFilename;
    }

    const { data: publicUrlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(destinationPath);

    if (publicUrlData?.publicUrl) {
      console.log(`✅ Uploaded to Supabase Storage: ${publicUrlData.publicUrl}`);
      return publicUrlData.publicUrl;
    }

    return localUrlOrFilename;
  } catch (err) {
    console.warn("⚠️ Image migration error:", err.message);
    return localUrlOrFilename;
  }
}

async function migrateHomeBanners() {
  console.log("==================================================");
  console.log("Starting Home Banner Migration: MongoDB -> Supabase");
  console.log("==================================================");

  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI is missing from backend/.env");
    process.exit(1);
  }

  if (!process.env.SUPABASE_URL) {
    console.error("❌ SUPABASE_URL is missing from backend/.env");
    process.exit(1);
  }

  const supabaseKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY;

  if (!supabaseKey) {
    console.error("❌ SUPABASE_SECRET_KEY is missing from backend/.env.");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB successfully.");

    const mongoBanners = await HomeBanner.find({}).lean();
    console.log(`Found ${mongoBanners.length} home banner record(s) in MongoDB.`);

    if (mongoBanners.length === 0) {
      console.log("ℹ️ No home banners to migrate from MongoDB.");
      await mongoose.disconnect();
      return;
    }

    // Verify if public.home_banners exists in Supabase
    const { error: checkTableErr } = await supabase
      .from("home_banners")
      .select("id")
      .limit(1);

    if (checkTableErr) {
      console.error(
        "❌ Supabase table 'public.home_banners' does not exist or is inaccessible:",
        checkTableErr.message
      );
      console.log("\n👉 Please run the migration SQL file first in your Supabase SQL Editor:");
      console.log("   supabase/home_banners.sql");
      await mongoose.disconnect();
      return;
    }

    let successCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    let imageMigratedCount = 0;

    for (const doc of mongoBanners) {
      try {
        // Idempotency check: see if a banner with the same title already exists in Supabase
        const { data: existing, error: checkErr } = await supabase
          .from("home_banners")
          .select("id, title")
          .eq("title", doc.title)
          .maybeSingle();

        if (checkErr) {
          console.warn(`⚠️ Note while checking existence of "${doc.title}":`, checkErr.message);
        }

        if (existing) {
          console.log(`⏭️  Skipped: Banner "${doc.title}" already exists in Supabase (id: ${existing.id})`);
          skippedCount++;
          continue;
        }

        // Migrate image to Supabase Storage if local
        let finalImageUrl = doc.image || "";
        if (finalImageUrl) {
          const original = finalImageUrl;
          finalImageUrl = await uploadLocalImageToSupabase(finalImageUrl);
          if (finalImageUrl !== original && finalImageUrl.includes("/storage/v1/object/public/")) {
            imageMigratedCount++;
          }
        }

        const newRecord = {
          smallText: doc.smallText || "Welcome to Sri Lakshmi Durga Agencies",
          title: doc.title || "Elegant Ladies Clothing & Essentials",
          description: doc.description || "Shop beautiful kurtis, dresses, tops, essentials and accessories at affordable prices.",
          offerText: doc.offerText || "Up to 40% OFF",
          image: finalImageUrl,
          isActive: true,
          created_at: doc.createdAt || new Date().toISOString(),
          updated_at: doc.updatedAt || new Date().toISOString(),
        };

        const { data: inserted, error: insertErr } = await supabase
          .from("home_banners")
          .insert([newRecord])
          .select("id, title")
          .single();

        if (insertErr) {
          console.error(`❌ Failed to insert banner "${doc.title}":`, insertErr.message);
          failedCount++;
        } else {
          console.log(`✅ Migrated: "${inserted.title}" -> Supabase ID ${inserted.id}`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Unexpected error migrating banner "${doc.title}":`, err.message);
        failedCount++;
      }
    }

    console.log("==================================================");
    console.log("Migration Summary:");
    console.log(`- Total MongoDB banners processed: ${mongoBanners.length}`);
    console.log(`- Successfully inserted: ${successCount}`);
    console.log(`- Local images migrated to Supabase Storage: ${imageMigratedCount}`);
    console.log(`- Skipped (already existed): ${skippedCount}`);
    console.log(`- Failed: ${failedCount}`);
    console.log("==================================================");

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB. Home Banner migration complete.");
  } catch (err) {
    console.error("Migration script fatal error:", err);
    process.exit(1);
  }
}

migrateHomeBanners();
