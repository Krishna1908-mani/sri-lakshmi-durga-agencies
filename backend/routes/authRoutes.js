const express = require("express");
const bcrypt = require("bcryptjs");
const supabase = require("../config/supabase");
const tokenService = require("../utils/tokenService");
const {
  requireCustomerAuth,
  requireAdminAuth,
  protectAdmin,
} = require("../middleware/authMiddleware");
const sendEmail = require("../utils/sendEmail");

const router = express.Router();

/**
 * ============================================================================
 * SRI LAKSHMI DURGA AGENCIES — AUTHENTICATION ROUTER
 * Handles separated Customer and Admin authentication flows, issuing
 * cryptographically isolated tokens and host-only cookies.
 * ============================================================================
 */

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

// ============================================================================
// CUSTOMER AUTHENTICATION ENDPOINTS
// ============================================================================

/**
 * Customer Registration
 * POST /api/auth/register or /api/v1/customer/auth/register
 */
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

    const token = tokenService.generateCustomerToken(data);
    tokenService.setCustomerCookie(res, token);

    res.status(201).json({
      success: true,
      message: "Customer registration successful",
      token,
      audience: tokenService.CUSTOMER_AUDIENCE,
      user: {
        id: String(data.id),
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

/**
 * Customer Login
 * POST /api/auth/login or /api/v1/customer/auth/login
 */
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
        message: "Invalid email or password",
      });
    }

    // Explicitly reject admins trying to use customer portal login
    if (user.role === "admin" && role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "This account has Administrative credentials. Access through the Customer Portal is blocked. Please access via the Admin Portal.",
        code: "ADMIN_ACCOUNT_BLOCKED_ON_CUSTOMER_PORTAL",
        isAdminAccount: true,
      });
    }

    // Reject customers trying to claim admin role on generic login
    if (role === "admin" && user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. This account does not have administrator privileges.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.role === "admin") {
      const token = tokenService.generateAdminToken(user);
      tokenService.setAdminCookie(res, token);
      return res.json({
        success: true,
        message: "Admin login successful",
        token,
        audience: tokenService.ADMIN_AUDIENCE,
        user: {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }

    const token = tokenService.generateCustomerToken(user);
    tokenService.setCustomerCookie(res, token);

    res.json({
      success: true,
      message: "Customer login successful",
      token,
      audience: tokenService.CUSTOMER_AUDIENCE,
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

/**
 * Customer Logout
 * POST /api/auth/logout or /api/v1/customer/auth/logout
 */
router.post("/logout", (req, res) => {
  tokenService.clearCustomerCookie(res);
  res.json({
    success: true,
    message: "Customer logged out successfully",
  });
});

/**
 * Customer Current Session Profile
 * GET /api/v1/customer/auth/me
 */
router.get("/customer/me", requireCustomerAuth, (req, res) => {
  res.json({
    success: true,
    portal: "customer",
    user: {
      id: String(req.user.id),
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

// ============================================================================
// ADMINISTRATOR AUTHENTICATION ENDPOINTS
// ============================================================================

/**
 * Dedicated Admin Portal Login
 * POST /api/auth/admin/login or /api/v1/admin/auth/login
 */
router.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Admin email and password are required",
      });
    }

    const trimmedEmail = typeof email === "string" ? email.toLowerCase().trim() : "";
    const admin = await findUserByEmail(trimmedEmail);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    // Strictly enforce role check
    if (admin.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied: This portal is strictly restricted to store administrators. Customer credentials are not permitted.",
        code: "CUSTOMER_CREDENTIALS_REJECTED",
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    const token = tokenService.generateAdminToken(admin);
    tokenService.setAdminCookie(res, token);

    res.json({
      success: true,
      message: "Administrator session established",
      token,
      audience: tokenService.ADMIN_AUDIENCE,
      user: {
        id: String(admin.id),
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

/**
 * Admin Logout
 * POST /api/auth/admin/logout or /api/v1/admin/auth/logout
 */
router.post("/admin/logout", (req, res) => {
  tokenService.clearAdminCookie(res);
  res.json({
    success: true,
    message: "Administrator logged out successfully",
  });
});

/**
 * Admin Current Session Profile
 * GET /api/v1/admin/auth/me
 */
router.get("/admin/me", requireAdminAuth, (req, res) => {
  res.json({
    success: true,
    portal: "admin",
    user: {
      id: String(req.user.id),
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

/**
 * Admin update email/password
 * PUT /api/auth/admin/update-profile
 */
router.put("/admin/update-profile", requireAdminAuth, async (req, res) => {
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
      .select("id, name, email, role")
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

// ============================================================================
// PASSWORD RESET FLOW (CUSTOMER)
// ============================================================================

/**
 * Forgot password - send OTP
 * POST /api/auth/forgot-password
 */
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
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
          <h2>Password Reset OTP</h2>
          <p>Hello ${user.name},</p>
          <p>Your OTP for password reset is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1e40af; margin: 16px 0;">${otp}</div>
          <p>This OTP is valid for 10 minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    res.json({
      success: true,
      message: "OTP sent to your email",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP email",
      error: error.message,
    });
  }
});

/**
 * Reset password using OTP
 * POST /api/auth/reset-password
 */
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