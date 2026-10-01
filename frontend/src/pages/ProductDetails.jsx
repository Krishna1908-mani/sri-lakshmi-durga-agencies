import { useParams, Link, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { 
  Star, 
  ShoppingBag, 
  Heart, 
  Check, 
  Truck, 
  ShieldCheck, 
  RotateCcw, 
  ZoomIn, 
  X, 
  ArrowLeft,
  ChevronRight,
  Sparkles,
  MessageSquare
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import API from "../api/axios";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: "",
  });

  const userToken = localStorage.getItem("userToken");

  const saveRecentlyViewed = (productData) => {
    const savedItems = JSON.parse(
      localStorage.getItem("recentlyViewed") || "[]"
    );

    const pid = productData.id || productData._id;

    const productToSave = {
      id: pid,
      _id: String(pid),
      name: productData.name,
      category: productData.category,
      price: productData.price,
      oldPrice: productData.oldPrice,
      stock: productData.stock,
      image: productData.image,
      rating: productData.rating,
      numReviews: productData.numReviews,
    };

    const filteredItems = savedItems.filter(
      (item) => (item.id || item._id) !== pid
    );

    const updatedItems = [productToSave, ...filteredItems].slice(0, 8);

    localStorage.setItem("recentlyViewed", JSON.stringify(updatedItems));
  };

  const fetchProduct = useCallback(async () => {
    try {
      const res = await API.get(`/products/${id}`);
      const productData = res.data.product;

      saveRecentlyViewed(productData);

      setProduct(productData);

      const gallery =
        productData.images && productData.images.length > 0
          ? productData.images
          : [productData.image];

      setSelectedImage(gallery[0]);

      if (productData.sizes && productData.sizes.length > 0) {
        setSelectedSize(productData.sizes[0]);
      }
    } catch (error) {
      console.log("Product fetch error:", error);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleReviewChange = (e) => {
    setReviewForm({ ...reviewForm, [e.target.name]: e.target.value });
  };

  const submitReview = async (e) => {
    e.preventDefault();

    if (!userToken) {
      alert("Please login to add review");
      navigate("/login");
      return;
    }

    try {
      await API.post(`/products/${id}/reviews`, reviewForm, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      alert("Review added successfully");

      setReviewForm({
        rating: 5,
        comment: "",
      });

      fetchProduct();
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Failed to add review");
    }
  };

  const handleAddToCart = () => {
    if (!product || product.stock <= 0 || isAdding) return;
    setIsAdding(true);
    addToCart(product, selectedSize);
    setTimeout(() => setIsAdding(false), 800);
  };

  if (!product) {
    return (
      <div className="page product-details-page">
        <div className="product-details-skeleton">
          <div className="skeleton-image-box"></div>
          <div className="skeleton-content-box">
            <div className="skeleton-bar" style={{ width: "40%" }}></div>
            <div className="skeleton-bar" style={{ width: "80%", height: "36px" }}></div>
            <div className="skeleton-bar" style={{ width: "30%", height: "28px" }}></div>
            <div className="skeleton-bar" style={{ width: "100%", height: "80px" }}></div>
          </div>
        </div>
      </div>
    );
  }

  const productId = product.id || product._id;
  const isOutOfStock = product.stock <= 0;
  const liked = isInWishlist(productId);

  const galleryImages =
    product.images && product.images.length > 0
      ? product.images
      : [product.image];

  const discountPercent =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : 0;

  const handleWishlistToggle = () => {
    if (liked) {
      removeFromWishlist(productId);
    } else {
      addToWishlist(product);
    }
  };

  return (
    <div className="page product-details-page">
      {/* Breadcrumb Navigation */}
      <nav className="details-breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} className="crumb-separator" />
        <Link to="/shop">Shop</Link>
        <ChevronRight size={14} className="crumb-separator" />
        {product.category && (
          <>
            <span className="crumb-category">{product.category}</span>
            <ChevronRight size={14} className="crumb-separator" />
          </>
        )}
        <span className="crumb-current">{product.name}</span>
      </nav>

      {/* Main 2-Column Product Showcase */}
      <div className="product-details">
        {/* Gallery Section */}
        <div className="product-image-box">
          <div className="product-main-image-wrapper">
            {discountPercent > 0 && (
              <span className="product-details-discount-badge">
                {discountPercent}% OFF
              </span>
            )}

            <button
              type="button"
              className={`details-wishlist-btn ${liked ? "is-liked" : ""}`}
              onClick={handleWishlistToggle}
              aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart size={20} className={liked ? "fill-current" : ""} />
            </button>

            <img
              src={selectedImage}
              alt={product.name}
              className="zoomable-product-image"
              onClick={() => setShowImageZoom(true)}
            />

            <button 
              type="button" 
              className="zoom-hint-btn" 
              onClick={() => setShowImageZoom(true)}
              aria-label="Zoom image"
            >
              <ZoomIn size={15} />
              <span>Tap to zoom</span>
            </button>
          </div>

          {galleryImages.length > 1 && (
            <div className="product-thumbnails">
              {galleryImages.map((img, index) => (
                <button
                  key={index}
                  type="button"
                  className={`thumb-btn ${selectedImage === img ? "active-thumb" : ""}`}
                  onClick={() => setSelectedImage(img)}
                  aria-label={`View image ${index + 1}`}
                >
                  <img
                    src={img}
                    alt={`${product.name} thumbnail ${index + 1}`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Information Section */}
        <div className="details-content">
          <div className="details-category-row">
            <span className="product-category-tag">{product.category || "Collection"}</span>
            {isOutOfStock ? (
              <span className="details-stock-badge out-stock">
                <span className="stock-dot"></span>
                Out of Stock
              </span>
            ) : (
              <span className="details-stock-badge in-stock">
                <span className="stock-dot"></span>
                In Stock ({product.stock} available)
              </span>
            )}
          </div>

          <h1 className="details-product-title">{product.name}</h1>

          {/* Rating */}
          <div className="details-rating-row">
            <div className="details-stars">
              <Star size={16} fill="#f59e0b" stroke="#f59e0b" />
              <span className="rating-score">{product.rating ? Number(product.rating).toFixed(1) : "4.5"}</span>
            </div>
            <span className="reviews-bullet">•</span>
            <span className="reviews-count-text">
              {product.numReviews || 0} Customer {product.numReviews === 1 ? "Review" : "Reviews"}
            </span>
          </div>

          {/* Pricing Row */}
          <div className="details-price-row">
            <div className="details-price-current">
              <span className="currency-symbol">₹</span>
              <span className="price-num">{product.price?.toLocaleString("en-IN")}</span>
            </div>
            {product.oldPrice > product.price && (
              <div className="details-price-original">
                <span className="old-price-num">₹{product.oldPrice?.toLocaleString("en-IN")}</span>
                <span className="savings-pill">
                  Save ₹{(product.oldPrice - product.price)?.toLocaleString("en-IN")}
                </span>
              </div>
            )}
          </div>

          <p className="details-desc">{product.description}</p>

          {/* Attributes highlight */}
          <div className="details-attributes-box">
            {product.fabric && (
              <div className="attribute-pill">
                <span className="attr-label">Fabric</span>
                <span className="attr-val">{product.fabric}</span>
              </div>
            )}
            {product.colors && product.colors.length > 0 && (
              <div className="attribute-pill">
                <span className="attr-label">Color</span>
                <span className="attr-val">
                  {Array.isArray(product.colors) ? product.colors.join(", ") : product.colors}
                </span>
              </div>
            )}
          </div>

          {/* Size Selector */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="size-box">
              <div className="size-header">
                <h3>Select Size</h3>
                {selectedSize && <span className="selected-size-label">Selected: <strong>{selectedSize}</strong></span>}
              </div>

              <div className="size-options-grid">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={`size-btn ${selectedSize === size ? "selected-size" : ""}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="details-action-buttons">
            <button
              type="button"
              className={`primary-btn details-cart-btn ${isAdding ? "is-added" : ""} ${isOutOfStock ? "disabled-btn" : ""}`}
              disabled={isOutOfStock}
              onClick={handleAddToCart}
            >
              {isAdding ? (
                <>
                  <Check size={18} />
                  <span>Added to Cart!</span>
                </>
              ) : isOutOfStock ? (
                <span>Sold Out</span>
              ) : (
                <>
                  <ShoppingBag size={18} />
                  <span>Add to Cart</span>
                </>
              )}
            </button>

            <Link to="/cart" className="secondary-btn details-view-cart-btn">
              <span>Go to Cart</span>
            </Link>
          </div>

          {/* Trust Guarantees Strip */}
          <div className="details-trust-strip">
            <div className="trust-item">
              <Truck size={18} className="trust-item-icon" />
              <div>
                <strong>Fast Dispatch</strong>
                <span>All India delivery in 3-5 days</span>
              </div>
            </div>
            <div className="trust-item">
              <ShieldCheck size={18} className="trust-item-icon" />
              <div>
                <strong>100% Authentic</strong>
                <span>Direct wholesale quality fabrics</span>
              </div>
            </div>
            <div className="trust-item">
              <RotateCcw size={18} className="trust-item-icon" />
              <div>
                <strong>Easy Support</strong>
                <span>Instant WhatsApp customer service</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <section className="reviews-section">
        <div className="reviews-header">
          <div className="reviews-header-badge">
            <MessageSquare size={16} />
            <span>Feedback</span>
          </div>
          <h2>Customer Reviews</h2>
          <p>Read experiences from shoppers or share your honest thoughts</p>
        </div>

        <div className="reviews-content-grid">
          {/* Write a review box */}
          <div className="review-form-box">
            <h3>Share Your Experience</h3>
            <p className="form-subtext">Verified buyers help others make better style decisions</p>

            <form onSubmit={submitReview}>
              <div className="form-field-group">
                <label htmlFor="review-rating">Overall Rating</label>
                <div className="rating-select-wrapper">
                  <select
                    id="review-rating"
                    name="rating"
                    value={reviewForm.rating}
                    onChange={handleReviewChange}
                    className="review-select"
                  >
                    <option value="5">⭐⭐⭐⭐⭐ 5 - Excellent Fit & Fabric</option>
                    <option value="4">⭐⭐⭐⭐ 4 - Very Good Product</option>
                    <option value="3">⭐⭐⭐ 3 - Good / Average</option>
                    <option value="2">⭐⭐ 2 - Fair</option>
                    <option value="1">⭐ 1 - Needs Improvement</option>
                  </select>
                </div>
              </div>

              <div className="form-field-group">
                <label htmlFor="review-comment">Your Review</label>
                <textarea
                  id="review-comment"
                  name="comment"
                  placeholder="Share details about the fabric, sizing, comfort, and color..."
                  value={reviewForm.comment}
                  onChange={handleReviewChange}
                  className="review-textarea"
                  required
                />
              </div>

              <button type="submit" className="primary-btn submit-review-btn">
                <span>Submit Review</span>
              </button>
            </form>
          </div>

          {/* Reviews list */}
          <div className="reviews-feed">
            {product.reviews && product.reviews.length > 0 ? (
              <div className="reviews-list">
                {product.reviews.map((review, rIdx) => (
                  <article className="review-card" key={review.id || review._id || rIdx}>
                    <div className="review-card-header">
                      <div className="review-avatar">
                        {review.userName ? review.userName.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="review-user-info">
                        <h4 className="review-user-name">{review.userName || "Verified Customer"}</h4>
                        <div className="review-stars-display">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={13}
                              fill={i < (review.rating || 5) ? "#f59e0b" : "none"}
                              stroke={i < (review.rating || 5) ? "#f59e0b" : "#cbd5e1"}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <p className="review-text">{review.comment}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="reviews-empty-state">
                <div className="empty-reviews-icon">
                  <Sparkles size={28} />
                </div>
                <h4>No reviews yet</h4>
                <p>Be the very first customer to review this piece and guide our shoppers!</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Image Zoom Modal Overlay */}
      {showImageZoom && (
        <div
          className="image-zoom-overlay"
          onClick={() => setShowImageZoom(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Image Zoom Preview"
        >
          <button 
            type="button" 
            className="zoom-close-btn" 
            onClick={() => setShowImageZoom(false)}
            aria-label="Close zoomed image"
          >
            <X size={24} />
          </button>

          <img
            src={selectedImage}
            alt={product.name}
            className="image-zoom-large"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

export default ProductDetails;