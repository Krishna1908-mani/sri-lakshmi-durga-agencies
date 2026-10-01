const dotenv = require("dotenv");
const path = require("path");
const mongoose = require("mongoose");

// Load backend/.env
dotenv.config({ path: path.join(__dirname, "../.env") });

const Product = require("../models/Product");
const rawSupabase = require("../config/supabase");
const supabase = rawSupabase.from ? rawSupabase : rawSupabase.supabase;

async function migrateProducts() {
  console.log("==================================================");
  console.log("Starting Product Migration: MongoDB -> Supabase");
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

  if (!supabaseKey || supabaseKey === "dummy-key-placeholder") {
    console.error(
      "❌ SUPABASE_SECRET_KEY is missing or invalid in backend/.env."
    );
    console.error(
      "Please set SUPABASE_SECRET_KEY (Service Role Key) in backend/.env to write to Supabase products table."
    );
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB successfully.");

    const mongoProducts = await Product.find({}).lean();
    console.log(`Found ${mongoProducts.length} products in MongoDB.`);

    if (mongoProducts.length === 0) {
      console.log("ℹ️ No products to migrate from MongoDB.");
      await mongoose.disconnect();
      return;
    }

    let successCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const doc of mongoProducts) {
      try {
        // Idempotency check: see if product with same name and category already exists
        const { data: existing, error: checkErr } = await supabase
          .from("products")
          .select("id, name")
          .eq("name", doc.name)
          .eq("category", doc.category)
          .maybeSingle();

        if (checkErr) {
          console.warn(
            `⚠️ Note while checking existence of "${doc.name}":`,
            checkErr.message
          );
        }

        if (existing) {
          console.log(
            `⏭️  Skipped: "${doc.name}" already exists in Supabase (id: ${existing.id})`
          );
          skippedCount++;
          continue;
        }

        // Clean Mongo-only fields (__v, _id) and prepare Supabase record
        const formattedReviews = Array.isArray(doc.reviews)
          ? doc.reviews.map((r) => ({
              userName: r.userName || "Customer",
              userEmail: r.userEmail || "",
              rating: Number(r.rating) || 5,
              comment: r.comment || "",
              createdAt: r.createdAt || new Date().toISOString(),
            }))
          : [];

        const newRecord = {
          name: doc.name,
          category: doc.category,
          price: Number(doc.price),
          "oldPrice": Number(doc.oldPrice) || 0,
          sizes: Array.isArray(doc.sizes) ? doc.sizes : [],
          colors: Array.isArray(doc.colors) ? doc.colors : [],
          fabric: doc.fabric || "",
          stock: Number(doc.stock) || 0,
          image: doc.image || "",
          images: Array.isArray(doc.images) ? doc.images : [],
          description: doc.description || "",
          rating: Number(doc.rating) || 0,
          "numReviews": Number(doc.numReviews) || 0,
          reviews: formattedReviews,
          "isActive": doc.isActive !== undefined ? doc.isActive : true,
          created_at: doc.createdAt || new Date().toISOString(),
          updated_at: doc.updatedAt || new Date().toISOString(),
        };

        const { data: inserted, error: insertErr } = await supabase
          .from("products")
          .insert([newRecord])
          .select("id, name")
          .single();

        if (insertErr) {
          console.error(
            `❌ Failed to insert "${doc.name}":`,
            insertErr.message
          );
          failedCount++;
        } else {
          console.log(
            `✅ Migrated: "${inserted.name}" -> Supabase ID ${inserted.id}`
          );
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Unexpected error migrating "${doc.name}":`, err.message);
        failedCount++;
      }
    }

    console.log("==================================================");
    console.log("Migration Summary:");
    console.log(`- Total MongoDB products processed: ${mongoProducts.length}`);
    console.log(`- Successfully inserted: ${successCount}`);
    console.log(`- Skipped (already existed): ${skippedCount}`);
    console.log(`- Failed: ${failedCount}`);
    console.log("==================================================");

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB. Migration script complete.");
  } catch (err) {
    console.error("Migration script fatal error:", err);
    process.exit(1);
  }
}

migrateProducts();
