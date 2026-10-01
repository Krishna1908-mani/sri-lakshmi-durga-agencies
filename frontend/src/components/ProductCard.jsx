import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const isOutOfStock = product.stock <= 0;
  const liked = isInWishlist(product._id);

  const handleWishlist = () => {
    if (liked) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist(product);
    }
  };

  return (
    <div className="product-card">
      <button className="wishlist-heart" onClick={handleWishlist}>
        {liked ? "❤️" : "🤍"}
      </button>

      <Link to={`/product/${product._id}`}>
        <img src={product.image} alt={product.name} />
      </Link>

      <div className="product-info">
        <h3>{product.name}</h3>

        <p className="product-category">{product.category}</p>

        <p className="product-rating-small">
          ⭐ {product.rating ? product.rating.toFixed(1) : "0.0"} (
          {product.numReviews || 0})
        </p>

        <p className="price">
          ₹{product.price} <span>₹{product.oldPrice}</span>
        </p>

        <p className={isOutOfStock ? "out-stock" : "in-stock"}>
          {isOutOfStock ? "Out of Stock" : `Stock: ${product.stock}`}
        </p>

        <button
          disabled={isOutOfStock}
          className={isOutOfStock ? "disabled-btn" : ""}
          onClick={() => addToCart(product)}
        >
          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </button>

        <Link to={`/product/${product._id}`} className="view-link">
          View Details
        </Link>
      </div>
    </div>
  );
}

export default ProductCard;