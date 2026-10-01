const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const adminEmail = "admin@srilakshmidurga.com";
    const adminPassword = "Admin@12345";

    const adminExists = await User.findOne({
      email: adminEmail,
    });

    if (adminExists) {
      console.log("Admin already exists");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await User.create({
      name: "Sri Lakshmi Durga Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
    });

    console.log("Admin created successfully");
    console.log("Email:", adminEmail);
    console.log("Password:", adminPassword);

    process.exit();
  } catch (error) {
    console.error("Admin seed error:", error.message);
    process.exit(1);
  }
};

createAdmin();