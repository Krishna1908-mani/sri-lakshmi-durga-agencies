const dotenv = require("dotenv");
const path = require("path");
const mongoose = require("mongoose");

dotenv.config({ path: path.join(__dirname, "../.env") });

const rawSupabase = require("../config/supabase");
const supabase = rawSupabase.from ? rawSupabase : rawSupabase.supabase;
const Product = require("../models/Product");
const HomeBanner = require("../models/HomeBanner");

async function detectOrphanImages() {
  const shouldClean = process.argv.includes("--clean") || process.argv.includes("--delete");

  console.log("==================================================");
  console.log("Supabase Storage: Orphan Image Detector");
  console.log("Mode:", shouldClean ? "SCAN & CLEAN (Delete Orphans)" : "SCAN ONLY (Report)");
  console.log("==================================================");

  try {
    // 1. Fetch files from Supabase bucket `product-images` under folders `products` and `banners`
    console.log("Fetching storage objects from 'product-images/products'...");
    const { data: productFiles, error: productErr } = await supabase.storage
      .from("product-images")
      .list("products", { limit: 1000, offset: 0, sortBy: { column: "created_at", order: "desc" } });

    if (productErr) {
      console.warn("⚠️ Warning listing products/ storage:", productErr.message);
    }

    console.log("Fetching storage objects from 'product-images/banners'...");
    const { data: bannerFiles, error: bannerErr } = await supabase.storage
      .from("product-images")
      .list("banners", { limit: 1000, offset: 0, sortBy: { column: "created_at", order: "desc" } });

    if (bannerErr) {
      console.warn("⚠️ Warning listing banners/ storage:", bannerErr.message);
    }

    const allFilesWithFolder = [
      ...(productFiles || []).map((f) => ({ ...f, folder: "products" })),
      ...(bannerFiles || []).map((f) => ({ ...f, folder: "banners" })),
    ];

    console.log(`Found ${allFilesWithFolder.length} total file(s) across products/ and banners/.`);

    // 2. Query referenced images from Supabase
    console.log("Fetching referenced images from Supabase databases (products & home_banners)...");
    const { data: supabaseProducts } = await supabase
      .from("products")
      .select("id, name, image, images");

    const { data: supabaseBanners } = await supabase
      .from("home_banners")
      .select("id, title, image");

    // 3. Query referenced images from MongoDB
    let mongoProducts = [];
    let mongoBanners = [];
    if (process.env.MONGO_URI) {
      try {
        console.log("Checking MongoDB referenced images...");
        await mongoose.connect(process.env.MONGO_URI);
        mongoProducts = await Product.find({}, "image images").lean();
        mongoBanners = await HomeBanner.find({}, "image").lean();
        await mongoose.disconnect();
      } catch (mErr) {
        console.warn("⚠️ Note: Mongo check skipped:", mErr.message);
      }
    }

    // 4. Build referenced filenames set
    const referencedFileNames = new Set();

    const collectNames = (url) => {
      if (!url || typeof url !== "string") return;
      if (url.includes("/product-images/")) {
        const relativePath = url.split("/product-images/")[1]?.split("?")[0];
        if (relativePath) referencedFileNames.add(relativePath);
      }
      const parts = url.split("/");
      const lastPart = parts[parts.length - 1]?.split("?")[0];
      if (lastPart) referencedFileNames.add(lastPart);
    };

    (supabaseProducts || []).forEach((p) => {
      collectNames(p.image);
      if (Array.isArray(p.images)) p.images.forEach(collectNames);
    });

    (supabaseBanners || []).forEach((b) => {
      collectNames(b.image);
    });

    mongoProducts.forEach((p) => {
      collectNames(p.image);
      if (Array.isArray(p.images)) p.images.forEach(collectNames);
    });

    mongoBanners.forEach((b) => {
      collectNames(b.image);
    });

    console.log(`Identified ${referencedFileNames.size} uniquely referenced image(s) in databases.`);

    // 5. Compare against bucket files
    const orphanFiles = [];
    const activeFiles = [];

    for (const file of allFilesWithFolder) {
      if (file.name === ".emptyFolderPlaceholder") continue;

      const fullPath = `${file.folder}/${file.name}`;
      if (referencedFileNames.has(file.name) || referencedFileNames.has(fullPath)) {
        activeFiles.push(file);
      } else {
        orphanFiles.push({ ...file, fullPath });
      }
    }

    console.log("==================================================");
    console.log("Scan Results:");
    console.log(`- Total storage files scanned: ${allFilesWithFolder.length}`);
    console.log(`- Active / in-use files: ${activeFiles.length}`);
    console.log(`- Orphaned files (unreferenced): ${orphanFiles.length}`);
    console.log("==================================================");

    if (orphanFiles.length > 0) {
      console.log("\nList of Orphaned Images:");
      orphanFiles.forEach((f, i) => {
        console.log(`  [${i + 1}] ${f.fullPath} (${(f.metadata?.size / 1024 || 0).toFixed(1)} KB)`);
      });

      if (shouldClean) {
        console.log("\nPurging orphaned files from Supabase Storage...");
        const filesToRemove = orphanFiles.map((f) => f.fullPath);
        const { data: removeRes, error: removeErr } = await supabase.storage
          .from("product-images")
          .remove(filesToRemove);

        if (removeErr) {
          console.error("❌ Failed to remove orphan files:", removeErr.message);
        } else {
          console.log(`✅ Successfully deleted ${removeRes?.length || filesToRemove.length} orphan image(s).`);
        }
      } else {
        console.log("\n💡 Tip: To delete these orphan files from Supabase Storage, run:");
        console.log("   npm run detect:orphans -- --clean");
      }
    } else {
      console.log("✅ Clean storage! Zero orphaned images detected across products and banners.");
    }
  } catch (err) {
    console.error("Fatal error:", err);
  }
}

detectOrphanImages();
