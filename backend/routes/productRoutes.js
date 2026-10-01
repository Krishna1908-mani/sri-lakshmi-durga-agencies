const express = require("express");

const supabase = require("../config/supabase");

const {
  protect,
  protectAdmin,
} = require("../middleware/authMiddleware");

const router = express.Router();

/*
============================================================
HELPER FUNCTIONS
============================================================
*/

function toNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

function toBoolean(value, fallback = true) {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.toLowerCase().trim();

    if (normalized === "true") return true;
    if (normalized === "false") return false;
    if (normalized === "1") return true;
    if (normalized === "0") return false;
  }

  return Boolean(value);
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return [];
    }

    // Try JSON array first
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);

        if (Array.isArray(parsed)) {
          return parsed
            .map((item) => String(item).trim())
            .filter(Boolean);
        }
      } catch {
        // Continue to comma-separated handling
      }
    }

    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

/*
============================================================
NORMALIZE PRODUCT

Supports both:

Supabase:
id

MongoDB:
_id

This prevents old frontend code from breaking.
============================================================
*/

function normalizeProduct(product) {
  if (!product) {
    return null;
  }

  const rawId =
    product.id !== undefined && product.id !== null
      ? product.id
      : product._id;

  const oldPrice =
    product.oldPrice !== undefined &&
    product.oldPrice !== null
      ? toNumber(product.oldPrice)
      : product.old_price !== undefined &&
        product.old_price !== null
      ? toNumber(product.old_price)
      : 0;

  const numReviews =
    product.numReviews !== undefined &&
    product.numReviews !== null
      ? toNumber(product.numReviews)
      : product.num_reviews !== undefined &&
        product.num_reviews !== null
      ? toNumber(product.num_reviews)
      : 0;

  const isActive =
    product.isActive !== undefined &&
    product.isActive !== null
      ? toBoolean(product.isActive)
      : product.is_active !== undefined &&
        product.is_active !== null
      ? toBoolean(product.is_active)
      : true;

  const createdAt =
    product.created_at ||
    product.createdAt ||
    null;

  const updatedAt =
    product.updated_at ||
    product.updatedAt ||
    null;

  return {
    ...product,

    // Support both new and old frontend code
    id: rawId,
    _id: rawId !== undefined ? String(rawId) : "",

    name: product.name || "",
    category: product.category || "",

    price: toNumber(product.price),

    oldPrice,
    old_price: oldPrice,

    sizes: Array.isArray(product.sizes)
      ? product.sizes
      : [],

    colors: Array.isArray(product.colors)
      ? product.colors
      : [],

    fabric: product.fabric || "",

    stock: toNumber(product.stock),

    image: product.image || "",

    images: Array.isArray(product.images)
      ? product.images
      : [],

    description: product.description || "",

    rating: toNumber(product.rating),

    numReviews,
    num_reviews: numReviews,

    reviews: Array.isArray(product.reviews)
      ? product.reviews
      : [],

    isActive,
    is_active: isActive,

    created_at: createdAt,
    updated_at: updatedAt,

    createdAt,
    updatedAt,
  };
}

/*
============================================================
PREPARE SUPABASE PAYLOAD
============================================================
*/

function prepareSupabasePayload(body) {
  const payload = {};

  if (body.name !== undefined) {
    payload.name = String(body.name).trim();
  }

  if (body.category !== undefined) {
    payload.category = String(
      body.category
    ).trim();
  }

  if (body.price !== undefined) {
    payload.price = toNumber(body.price);
  }

  if (body.oldPrice !== undefined) {
    payload.oldPrice = toNumber(
      body.oldPrice
    );
  } else if (body.old_price !== undefined) {
    payload.oldPrice = toNumber(
      body.old_price
    );
  }

  if (body.sizes !== undefined) {
    payload.sizes = toArray(body.sizes);
  }

  if (body.colors !== undefined) {
    payload.colors = toArray(body.colors);
  }

  if (body.fabric !== undefined) {
    payload.fabric = String(
      body.fabric
    ).trim();
  }

  if (body.stock !== undefined) {
    payload.stock = Math.max(
      0,
      Math.floor(toNumber(body.stock))
    );
  }

  if (body.image !== undefined) {
    payload.image = String(
      body.image
    ).trim();
  }

  if (body.images !== undefined) {
    payload.images = toArray(body.images);
  }

  if (body.description !== undefined) {
    payload.description = String(
      body.description
    ).trim();
  }

  if (body.rating !== undefined) {
    payload.rating = Math.min(
      5,
      Math.max(0, toNumber(body.rating))
    );
  }

  if (body.numReviews !== undefined) {
    payload.numReviews = Math.max(
      0,
      Math.floor(
        toNumber(body.numReviews)
      )
    );
  } else if (
    body.num_reviews !== undefined
  ) {
    payload.numReviews = Math.max(
      0,
      Math.floor(
        toNumber(body.num_reviews)
      )
    );
  }

  if (body.reviews !== undefined) {
    payload.reviews = Array.isArray(
      body.reviews
    )
      ? body.reviews
      : [];
  }

  if (body.isActive !== undefined) {
    payload.isActive = toBoolean(
      body.isActive
    );
  } else if (
    body.is_active !== undefined
  ) {
    payload.isActive = toBoolean(
      body.is_active
    );
  }

  return payload;
}

/*
============================================================
VALIDATE NEW PRODUCT
============================================================
*/

function validateNewProduct(payload) {
  if (!payload.name) {
    return "Product name is required";
  }

  if (!payload.category) {
    return "Product category is required";
  }

  if (
    payload.price === undefined ||
    payload.price < 0
  ) {
    return "Valid product price is required";
  }

  if (!payload.image) {
    return "Product image is required";
  }

  return null;
}

/*
============================================================
REMOVE DUPLICATES DURING MONGO -> SUPABASE MIGRATION
============================================================
*/

/*
============================================================
PUBLIC
GET ALL PRODUCTS (SUPABASE ONLY)
============================================================
*/

router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("isActive", true)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Supabase product fetch error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch products",
      });
    }

    const products = (data || []).map(normalizeProduct);

    return res.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error(
      "GET /api/products error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
});

/*
============================================================
PUBLIC
GET SINGLE PRODUCT
============================================================
*/

router.get("/:id", async (req, res) => {
  try {
    const rawId = req.params.id;

    const numericId =
      Number(rawId);

    /*
    -----------------------------
    SUPABASE PRODUCT
    -----------------------------
    */

    if (
      rawId !== "" &&
      Number.isInteger(numericId) &&
      numericId > 0
    ) {
      const {
        data,
        error,
      } = await supabase
        .from("products")
        .select("*")
        .eq("id", numericId)
        .eq("isActive", true)
        .maybeSingle();

      if (error) {
        console.error(
          "Supabase single product error:",
          error.message
        );

        return res.status(500).json({
          success: false,
          message:
            "Failed to fetch product",
          error: error.message,
        });
      }

      if (!data) {
        return res.status(404).json({
          success: false,
          message:
            "Product not found",
        });
      }

      return res.json({
        success: true,
        product:
          normalizeProduct(data),
      });
    }

    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  } catch (error) {
    console.error(
      "GET /api/products/:id error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch product",
      error: error.message,
    });
  }
});

/*
============================================================
CUSTOMER
ADD REVIEW
============================================================
*/

router.post(
  "/:id/reviews",
  protect,
  async (req, res) => {
    try {
      const rawId =
        req.params.id;

      const numericId =
        Number(rawId);

      const rating = Number(
        req.body.rating
      );

      const comment = String(
        req.body.comment || ""
      ).trim();

      /*
      ---------------------------
      VALIDATION
      ---------------------------
      */

      if (
        !Number.isFinite(rating) ||
        rating < 1 ||
        rating > 5
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Rating must be between 1 and 5",
        });
      }

      if (!comment) {
        return res.status(400).json({
          success: false,
          message:
            "Review comment is required",
        });
      }

      /*
      ==================================================
      SUPABASE REVIEW
      ==================================================
      */

      if (
        rawId !== "" &&
        Number.isInteger(numericId) &&
        numericId > 0
      ) {
        const {
          data: product,
          error: fetchError,
        } = await supabase
          .from("products")
          .select("*")
          .eq("id", numericId)
          .eq("isActive", true)
          .maybeSingle();

        if (fetchError) {
          console.error(
            "Supabase review fetch error:",
            fetchError.message
          );

          return res
            .status(500)
            .json({
              success: false,
              message:
                "Failed to load product",
              error:
                fetchError.message,
            });
        }

        if (!product) {
          return res
            .status(404)
            .json({
              success: false,
              message:
                "Product not found",
            });
        }

        const reviews =
          Array.isArray(
            product.reviews
          )
            ? [...product.reviews]
            : [];

        const alreadyReviewed =
          reviews.some(
            (review) =>
              String(
                review.userEmail
              ).toLowerCase() ===
              String(
                req.user.email
              ).toLowerCase()
          );

        if (alreadyReviewed) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "You already reviewed this product",
            });
        }

        const review = {
          _id: `rev_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 8)}`,

          userName:
            req.user.name ||
            "Customer",

          userEmail:
            req.user.email,

          rating,

          comment,

          createdAt:
            new Date().toISOString(),

          updatedAt:
            new Date().toISOString(),
        };

        reviews.push(review);

        const numReviews =
          reviews.length;

        const totalRating =
          reviews.reduce(
            (total, item) =>
              total +
              toNumber(
                item.rating
              ),
            0
          );

        const averageRating =
          numReviews > 0
            ? totalRating /
              numReviews
            : 0;

        const {
          data: updatedProduct,
          error: updateError,
        } = await supabase
          .from("products")
          .update({
            reviews,

            numReviews,

            rating: Number(
              averageRating.toFixed(
                2
              )
            ),
          })
          .eq("id", numericId)
          .select("*")
          .single();

        if (updateError) {
          console.error(
            "Supabase review update error:",
            updateError.message
          );

          return res
            .status(500)
            .json({
              success: false,
              message:
                "Failed to add review",
              error:
                updateError.message,
            });
        }

        return res
          .status(201)
          .json({
            success: true,
            message:
              "Review added successfully",
            product:
              normalizeProduct(
                updatedProduct
              ),
          });
      }

      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    } catch (error) {
      console.error(
        "POST review error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to add review",
          error: error.message,
        });
    }
  }
);

/*
============================================================
ADMIN
ADD PRODUCT

NEW PRODUCTS ARE SAVED TO SUPABASE.
============================================================
*/

router.post(
  "/",
  protectAdmin,
  async (req, res) => {
    try {
      const payload =
        prepareSupabasePayload(
          req.body
        );

      const validationError =
        validateNewProduct(
          payload
        );

      if (validationError) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              validationError,
          });
      }

      /*
      Product.js defaults
      */

      if (
        payload.oldPrice ===
        undefined
      ) {
        payload.oldPrice = 0;
      }

      if (
        payload.sizes === undefined
      ) {
        payload.sizes = [];
      }

      if (
        payload.colors === undefined
      ) {
        payload.colors = [];
      }

      if (
        payload.fabric ===
        undefined
      ) {
        payload.fabric = "";
      }

      if (
        payload.stock === undefined
      ) {
        payload.stock = 0;
      }

      if (
        payload.images === undefined
      ) {
        payload.images = [];
      }

      if (
        payload.description ===
        undefined
      ) {
        payload.description =
          "";
      }

      if (
        payload.rating === undefined
      ) {
        payload.rating = 0;
      }

      if (
        payload.numReviews ===
        undefined
      ) {
        payload.numReviews = 0;
      }

      if (
        payload.reviews ===
        undefined
      ) {
        payload.reviews = [];
      }

      if (
        payload.isActive ===
        undefined
      ) {
        payload.isActive = true;
      }

      const {
        data,
        error,
      } = await supabase
        .from("products")
        .insert([payload])
        .select("*")
        .single();

      if (error) {
        console.error(
          "Supabase add product error:",
          error
        );

        return res
          .status(500)
          .json({
            success: false,
            message:
              "Failed to add product to Supabase",
            error:
              error.message,
          });
      }

      return res
        .status(201)
        .json({
          success: true,
          message:
            "Product added successfully",
          product:
            normalizeProduct(data),
        });
    } catch (error) {
      console.error(
        "POST /api/products error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to add product",
          error: error.message,
        });
    }
  }
);

/*
============================================================
ADMIN
UPDATE PRODUCT
============================================================
*/

router.put(
  "/:id",
  protectAdmin,
  async (req, res) => {
    try {
      const rawId =
        req.params.id;

      const numericId =
        Number(rawId);

      /*
      ==================================================
      SUPABASE PRODUCT
      ==================================================
      */

      if (
        rawId !== "" &&
        Number.isInteger(numericId) &&
        numericId > 0
      ) {
        const payload =
          prepareSupabasePayload(
            req.body
          );

        if (
          Object.keys(payload)
            .length === 0
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "No valid product fields supplied",
            });
        }

        if (payload.image) {
          try {
            const { data: currentProduct } = await supabase
              .from("products")
              .select("image")
              .eq("id", numericId)
              .maybeSingle();

            if (
              currentProduct?.image &&
              currentProduct.image !== payload.image &&
              currentProduct.image.includes("/storage/v1/object/public/product-images/")
            ) {
              const oldPath = currentProduct.image.split(
                "/storage/v1/object/public/product-images/"
              )[1];

              if (oldPath) {
                await supabase.storage
                  .from("product-images")
                  .remove([oldPath]);
                console.log("Auto-deleted replaced Supabase image:", oldPath);
              }
            }
          } catch (imgErr) {
            console.warn("Old image deletion check note:", imgErr.message);
          }
        }

        const {
          data,
          error,
        } = await supabase
          .from("products")
          .update(payload)
          .eq("id", numericId)
          .select("*")
          .maybeSingle();

        if (error) {
          console.error(
            "Supabase update product error:",
            error
          );

          return res
            .status(500)
            .json({
              success: false,
              message:
                "Failed to update product",
              error:
                error.message,
            });
        }

        if (!data) {
          return res
            .status(404)
            .json({
              success: false,
              message:
                "Product not found",
            });
        }

        return res.json({
          success: true,
          message:
            "Product updated successfully",
          product:
            normalizeProduct(data),
        });
      }

      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    } catch (error) {
      console.error(
        "PUT /api/products/:id error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to update product",
          error: error.message,
        });
    }
  }
);

/*
============================================================
ADMIN
DELETE PRODUCT

Soft-delete only:
isActive = false
============================================================
*/

router.delete(
  "/:id",
  protectAdmin,
  async (req, res) => {
    try {
      const rawId =
        req.params.id;

      const numericId =
        Number(rawId);

      /*
      ==================================================
      SUPABASE
      ==================================================
      */

      if (
        rawId !== "" &&
        Number.isInteger(numericId) &&
        numericId > 0
      ) {
        const {
          data,
          error,
        } = await supabase
          .from("products")
          .update({
            isActive: false,
          })
          .eq("id", numericId)
          .select("id")
          .maybeSingle();

        if (error) {
          console.error(
            "Supabase delete product error:",
            error
          );

          return res
            .status(500)
            .json({
              success: false,
              message:
                "Failed to delete product",
              error:
                error.message,
            });
        }

        if (!data) {
          return res
            .status(404)
            .json({
              success: false,
              message:
                "Product not found",
            });
        }

        return res.json({
          success: true,
          message:
            "Product deleted successfully",
        });
      }

      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    } catch (error) {
      console.error(
        "DELETE /api/products/:id error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to delete product",
          error: error.message,
        });
    }
  }
);

module.exports = router;