const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const User = require("./models/User");

dotenv.config();

const resetAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const adminEmail = "admin@srilakshmidurga.com";
    const adminPassword = "Admin@12345";

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    let admin = await User.findOne({ role: "admin" });

    if (admin) {
      admin.name = "Sri Lakshmi Durga Admin";
      admin.email = adminEmail;
      admin.password = hashedPassword;
      admin.role = "admin";

      await admin.save();

      console.log("Admin updated successfully");
    } else {
      await User.create({
        name: "Sri Lakshmi Durga Admin",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
      });

      console.log("Admin created successfully");
    }

    console.log("Login Email:", adminEmail);
    console.log("Login Password:", adminPassword);

    process.exit();
  } catch (error) {
    console.log("Admin reset failed:", error.message);
    process.exit(1);
  }
};

resetAdmin();