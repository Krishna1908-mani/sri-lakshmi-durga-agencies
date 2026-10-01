require("dotenv").config();

const mongoose = require("mongoose");
const supabase = require("../config/supabase");
const User = require("../models/User");

async function migrateUsers() {
  console.log("============================================================");
  console.log("STARTING USER MIGRATION: MONGODB -> SUPABASE");
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

    // Fetch existing users from MongoDB
    const mongoUsers = await User.find().lean();
    console.log(`Found ${mongoUsers.length} user(s) in MongoDB.`);

    if (mongoUsers.length === 0) {
      console.log("No users found to migrate.");
      return;
    }

    // Fetch existing users in Supabase to avoid duplicates
    const { data: existingSupabaseUsers, error: fetchError } = await supabase
      .from("users")
      .select("email, legacy_mongo_id");

    if (fetchError) {
      throw new Error(
        `Failed to query Supabase users table: ${fetchError.message}. Make sure supabase/users.sql has been executed in the Supabase Dashboard SQL Editor.`
      );
    }

    const existingEmails = new Set(
      (existingSupabaseUsers || []).map((u) => String(u.email).toLowerCase().trim())
    );

    let migratedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const user of mongoUsers) {
      const email = String(user.email || "").toLowerCase().trim();

      if (!email) {
        console.warn(`[SKIP] User without email found (Mongo ID: ${user._id})`);
        skippedCount++;
        continue;
      }

      if (existingEmails.has(email)) {
        console.log(`[SKIP] User with email '${email}' already exists in Supabase.`);
        skippedCount++;
        continue;
      }

      const payload = {
        name: String(user.name || "").trim() || "User",
        email,
        password: user.password, // bcrypt hash copied unchanged without re-hashing
        role: user.role === "admin" ? "admin" : "customer",
        resetOtp: user.resetOtp || "",
        resetOtpExpire: user.resetOtpExpire || null,
        legacy_mongo_id: String(user._id),
        created_at: user.createdAt || new Date().toISOString(),
        updated_at: user.updatedAt || new Date().toISOString(),
      };

      const { data: inserted, error: insertError } = await supabase
        .from("users")
        .insert(payload)
        .select("id, name, email, role")
        .single();

      if (insertError) {
        console.error(`[FAIL] Failed to migrate user '${email}':`, insertError.message);
        failedCount++;
      } else {
        console.log(
          `[MIGRATED] User '${inserted.email}' (${inserted.role}) -> Supabase ID ${inserted.id}`
        );
        existingEmails.add(email);
        migratedCount++;
      }
    }

    console.log("\n============================================================");
    console.log("USER MIGRATION SUMMARY");
    console.log("============================================================");
    console.log(`Total MongoDB users: ${mongoUsers.length}`);
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
  migrateUsers();
}

module.exports = migrateUsers;
