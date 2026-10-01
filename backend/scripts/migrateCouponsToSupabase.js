require("dotenv").config();

const mongoose = require("mongoose");
const supabase = require("../config/supabase");
const Coupon = require("../models/Coupon");

async function migrateCoupons() {
  console.log("============================================================");
  console.log("STARTING COUPON MIGRATION: MONGODB -> SUPABASE");
  console.log("============================================================");

  let mongoConnected = false;

  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in backend/.env");
    }

    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    mongoConnected = true;
    console.log("MongoDB connected successfully.\n");

    // Fetch existing coupons from MongoDB
    const mongoCoupons = await Coupon.find().lean();
    console.log(`Found ${mongoCoupons.length} coupon(s) in MongoDB.`);

    if (mongoCoupons.length === 0) {
      console.log("No coupons found to migrate.");
      return;
    }

    // Fetch existing coupons in Supabase to avoid duplicates
    const { data: existingSupabaseCoupons, error: fetchError } = await supabase
      .from("coupons")
      .select("code");

    if (fetchError) {
      throw new Error(
        `Failed to query Supabase coupons table: ${fetchError.message}. Make sure supabase/coupons.sql has been executed in the Supabase Dashboard SQL Editor.`
      );
    }

    const existingCodes = new Set(
      (existingSupabaseCoupons || []).map((c) => String(c.code).toUpperCase().trim())
    );

    let migratedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const coupon of mongoCoupons) {
      const code = String(coupon.code || "").toUpperCase().trim();

      if (!code) {
        console.warn(`[SKIP] Coupon without code found (Mongo ID: ${coupon._id})`);
        skippedCount++;
        continue;
      }

      if (existingCodes.has(code)) {
        console.log(`[SKIP] Coupon '${code}' already exists in Supabase.`);
        skippedCount++;
        continue;
      }

      const payload = {
        code,
        discountType: coupon.discountType === "FLAT" ? "FLAT" : "PERCENT",
        discountValue: Number(coupon.discountValue) || 0,
        minOrderAmount: Number(coupon.minOrderAmount) || 0,
        isActive: coupon.isActive !== undefined ? Boolean(coupon.isActive) : true,
        created_at: coupon.createdAt || new Date().toISOString(),
        updated_at: coupon.updatedAt || new Date().toISOString(),
      };

      const { data: inserted, error: insertError } = await supabase
        .from("coupons")
        .insert(payload)
        .select()
        .single();

      if (insertError) {
        console.error(`[FAIL] Failed to migrate coupon '${code}':`, insertError.message);
        failedCount++;
      } else {
        console.log(`[MIGRATED] Coupon '${code}' -> Supabase ID ${inserted.id}`);
        existingCodes.add(code);
        migratedCount++;
      }
    }

    console.log("\n============================================================");
    console.log("COUPON MIGRATION SUMMARY");
    console.log("============================================================");
    console.log(`Total MongoDB coupons: ${mongoCoupons.length}`);
    console.log(`Successfully migrated: ${migratedCount}`);
    console.log(`Skipped (already exists): ${skippedCount}`);
    console.log(`Failed: ${failedCount}`);
    console.log("============================================================\n");
  } catch (error) {
    console.error("Migration fatal error:", error.message);
    process.exitCode = 1;
  } finally {
    if (mongoConnected) {
      await mongoose.disconnect();
      console.log("MongoDB connection closed.");
    }
  }
}

if (require.main === module) {
  migrateCoupons();
}

module.exports = migrateCoupons;
