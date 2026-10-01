const jwt = require("jsonwebtoken");
const supabase = require("../config/supabase");

async function findUserByIdOrLegacy(identifier) {
  if (!identifier) return null;

  const idStr = String(identifier).trim();
  const isNumeric = /^\d+$/.test(idStr);

  try {
    let query = supabase.from("users").select("id, name, email, role, legacy_mongo_id");

    if (isNumeric) {
      query = query.eq("id", Number(idStr));
    } else {
      query = query.eq("legacy_mongo_id", idStr);
    }

    const { data, error } = await query.maybeSingle();

    if (!error && data) {
      return {
        _id: String(data.id),
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
      };
    }
  } catch (sbErr) {
    console.error("Supabase auth user query error:", sbErr.message);
  }

  return null;
}

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token missing",
      });
    }

    const secret = process.env.JWT_SECRET || "fallback_default_jwt_secret_dev_only";
    const decoded = jwt.verify(token, secret);

    const user = await findUserByIdOrLegacy(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

const protectAdmin = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token missing",
      });
    }

    const secret = process.env.JWT_SECRET || "fallback_default_jwt_secret_dev_only";
    const decoded = jwt.verify(token, secret);

    const user = await findUserByIdOrLegacy(decoded.id);

    if (!user || user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access only",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

module.exports = { protect, protectAdmin, findUserByIdOrLegacy };