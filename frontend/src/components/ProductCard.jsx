import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Star, ShoppingBag, Check, Eye } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [isAdding, setIsAdding] = useState(false);

  const productId = product.id || product._id;
  const isOutOfStock = product.stock <= 0;
  const liked = isInWishlist(productId);

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (liked) {
      removeFromWishlist(productId);
    } else {
      addToWishlist(product);
    }
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || isAdding) return;

    setIsAdding(true);
    addToCart(product);
    setTimeout(() => setIsAdding(false), 800);
  };

  const discountPercent =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : 0;

  const productImage = product.image || product.imageUrl || "https://via.placeholder.com/300x350?text=Product+Image";

  return (
    <article className="product-card">
      <div className="product-image-container">
        {discountPercent > 0 && (
          <span className="product-discount-badge">
            {discountPercent}% OFF
          </span>
        )}

        <button
          type="button"
          className={`wishlist-heart-btn ${liked ? "is-liked" : ""}`}
          onClick={handleWishlist}
          aria-label={liked ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        >
          <Heart 
            size={18} 
            className={`heart-svg ${liked ? "fill-current" : ""}`} 
            strokeWidth={2}
          />
        </button>

        <Link to={`/product/${productId}`} className="product-img-link" tabIndex={-1}>
          <img
            src={productImage}
            alt={product.name}
            loading="lazy"
            className="product-card-img"
          />
        </Link>
      </div>

      <div className="product-info">
        <span className="product-category">{product.category || "General"}</span>

        <h3 className="product-title">
          <Link to={`/product/${productId}`}>{product.name}</Link>
        </h3>

        <div className="product-rating-row">
          <div className="star-rating-badge">
            <Star size={13} className="star-svg-fill" fill="#f59e0b" stroke="#f59e0b" />
            <span className="rating-value">{product.rating ? Number(product.rating).toFixed(1) : "4.5"}</span>
          </div>
          <span className="reviews-count">({product.numReviews || 0} reviews)</span>
        </div>

        <div className="price-row">
          <div className="price-current-group">
            <span className="currency-prefix">₹</span>
            <span className="current-price">{product.price?.toLocaleString("en-IN")}</span>
          </div>
          {product.oldPrice > product.price && (
            <span className="original-price">₹{product.oldPrice?.toLocaleString("en-IN")}</span>
          )}
        </div>

        <div className="stock-status-row">
          <span className={isOutOfStock ? "stock-badge out-stock" : "stock-badge in-stock"}>
            <span className="stock-dot"></span>
            {isOutOfStock ? "Out of Stock" : `In Stock (${product.stock})`}
          </span>
        </div>

        <div className="product-card-actions">
          <button
            type="button"
            disabled={isOutOfStock}
            className={`card-cart-btn ${isAdding ? "is-added" : ""} ${isOutOfStock ? "disabled-btn" : ""}`}
            onClick={handleAddToCart}
            aria-label={isOutOfStock ? "Out of stock" : `Add ${product.name} to cart`}
          >
            {isAdding ? (
              <>
                <Check size={16} />
                <span>Added!</span>
              </>
            ) : isOutOfStock ? (
              <span>Sold Out</span>
            ) : (
              <>
                <ShoppingBag size={16} />
                <span>Add to Cart</span>
              </>
            )}
          </button>

          <Link to={`/product/${productId}`} className="view-details-link" title="View details">
            <Eye size={16} />
            <span>Details</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;