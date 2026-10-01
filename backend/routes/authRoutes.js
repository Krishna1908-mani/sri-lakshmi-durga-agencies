const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const supabase = require("../config/supabase");
const { protectAdmin } = require("../middleware/authMiddleware");
const sendEmail = require("../utils/sendEmail");

const router = express.Router();

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || "fallback_default_jwt_secret_dev_only";
  return jwt.sign({ id: String(id) }, secret, {
    expiresIn: "30d",
  });
};

async function findUserByEmail(email) {
  if (!email) return null;
  const trimmedEmail = String(email).toLowerCase().trim();

  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", trimmedEmail)
      .maybeSingle();

    if (!error && data) {
      return {
        _id: String(data.id),
        id: data.id,
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        resetOtp: data.resetOtp || "",
        resetOtpExpire: data.resetOtpExpire || null,
        legacy_mongo_id: data.legacy_mongo_id || null,
      };
    }
  } catch (sbErr) {
    console.error("Supabase findUserByEmail error:", sbErr.message);
  }

  return null;
}

// Customer register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const existingUser = await findUserByEmail(trimmedEmail);

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("users")
      .insert({
        name: name.trim(),
        email: trimmedEmail,
        password: hashedPassword,
        role: "customer",
      })
      .select("id, name, email, role")
      .single();

    if (error || !data) {
      return res.status(500).json({
        success: false,
        message: "Registration failed",
        error: error?.message,
      });
    }

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token: generateToken(data.id),
      user: {
        name: data.name,
        email: data.email,
        role: data.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
});

// User / Admin login (Supports both Customer and Admin)
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const trimmedEmail = typeof email === "string" ? email.toLowerCase().trim() : "";
    const user = await findUserByEmail(trimmedEmail);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: role === "admin" ? "Invalid admin email or password" : "Invalid email or password",
      });
    }

    // Role check if explicitly requested
    if (role && user.role !== role) {
      if (role === "admin" && user.role === "customer") {
        return res.status(403).json({
          success: false,
          message: "Access denied. This account does not have administrator privileges.",
        });
      }
      if (role === "customer" && user.role === "admin") {
        return res.status(400).json({
          success: false,
          message: "This account has administrator privileges. Please switch to the Admin login tab.",
        });
      }
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: role === "admin" ? "Invalid admin email or password" : "Invalid email or password",
      });
    }

    res.json({
      success: true,
      message: `${user.role === "admin" ? "Admin" : "Customer"} login successful`,
      token: generateToken(user.id),
      user: {
        id: String(user.id),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
});

// Admin login
router.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const trimmedEmail = typeof email === "string" ? email.toLowerCase().trim() : "";
    const admin = await findUserByEmail(trimmedEmail);

    if (!admin || admin.role !== "admin") {
      return res.status(401).json({
        success: false,
        message: "Invalid admin email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin email or password",
      });
    }

    res.json({
      success: true,
      message: "Admin login successful",
      token: generateToken(admin.id),
      user: {
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Admin login failed",
      error: error.message,
    });
  }
});

// Admin update email/password
router.put("/admin/update-profile", protectAdmin, async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password is required to update profile",
      });
    }

    const admin = await findUserByEmail(req.user.email);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin not found",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is wrong",
      });
    }

    const updates = {};
    if (name) updates.name = name.trim();

    if (email && email.toLowerCase().trim() !== admin.email) {
      const newEmail = email.toLowerCase().trim();
      const emailExists = await findUserByEmail(newEmail);

      if (emailExists && String(emailExists.id) !== String(admin.id)) {
        return res.status(400).json({
          success: false,
          message: "Email already used by another account",
        });
      }

      updates.email = newEmail;
    }

    if (newPassword && newPassword.trim().length > 0) {
      updates.password = await bcrypt.hash(newPassword, 10);
    }

    const { data: updatedAdmin, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", admin.id)
      .select("name, email, role")
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to update admin profile",
        error: error.message,
      });
    }

    res.json({
      success: true,
      message: "Admin profile updated successfully",
      user: updatedAdmin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update admin profile",
      error: error.message,
    });
  }
});

// Forgot password - send OTP
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const trimmedEmail = typeof email === "string" ? email.toLowerCase().trim() : "";
    const user = await findUserByEmail(trimmedEmail);

    if (!user || user.role !== "customer") {
      return res.status(404).json({
        success: false,
        message: "Customer email not found",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expireTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from("users")
      .update({
        resetOtp: hashedOtp,
        resetOtpExpire: expireTime,
      })
      .eq("id", user.id);

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to set reset token",
        error: error.message,
      });
    }

    await sendEmail({
      to: user.email,
      subject: "Password Reset OTP - Sri Lakshmi Durga Agencies",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Password Reset OTP</h2>
          <p>Hello ${user.name},</p>
          <p>Your OTP for password reset is:</p>
          <h1>${otp}</h1>
          <p>This OTP is valid for 10 minutes.</p>
          <p>If you did not request this, ignore this email.</p>
        </div>
      `,
    });

    res.json({
      success: true,
      message: "OTP sent to your email",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP email",
      error: error.message,
    });
  }
});

// Reset password using OTP
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required",
      });
    }

    const trimmedEmail = typeof email === "string" ? email.toLowerCase().trim() : "";
    const user = await findUserByEmail(trimmedEmail);

    if (!user || user.role !== "customer") {
      return res.status(404).json({
        success: false,
        message: "Customer email not found",
      });
    }

    if (!user.resetOtp || !user.resetOtpExpire) {
      return res.status(400).json({
        success: false,
        message: "Please request OTP first",
      });
    }

    if (new Date(user.resetOtpExpire).getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired. Request new OTP",
      });
    }

    const isOtpMatch = await bcrypt.compare(otp.toString(), user.resetOtp);

    if (!isOtpMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    const { error } = await supabase
      .from("users")
      .update({
        password: newHashedPassword,
        resetOtp: "",
        resetOtpExpire: null,
      })
      .eq("id", user.id);

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Password reset failed",
        error: error.message,
      });
    }

    res.json({
      success: true,
      message: "Password reset successful. Please login",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Password reset failed",
      error: error.message,
    });
  }
});

module.exports = router;