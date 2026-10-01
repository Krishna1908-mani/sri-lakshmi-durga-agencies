import { Link } from "react-router-dom";
import { Heart, ShoppingBag, ArrowRight } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { useWishlist } from "../context/WishlistContext";

function Wishlist() {
  const { wishlistItems, removeFromWishlist } = useWishlist();

  return (
    <div className="page wishlist-page">
      <div className="wishlist-header">
        <div>
          <div className="wishlist-title-row">
            <h1>My Wishlist</h1>
            {wishlistItems.length > 0 && (
              <span className="wishlist-count-badge">
                {wishlistItems.length} {wishlistItems.length === 1 ? "Item" : "Items"}
              </span>
            )}
          </div>
          <p className="wishlist-subtitle">Save your favorite pieces and styles to shop whenever you're ready</p>
        </div>

        {wishlistItems.length > 0 && (
          <Link to="/shop" className="wishlist-browse-link">
            <span>Explore More Styles</span>
            <ArrowRight size={15} />
          </Link>
        )}
      </div>

      {wishlistItems.length === 0 ? (
        <div className="wishlist-empty-state">
          <div className="empty-wishlist-illustration">
            <Heart size={48} strokeWidth={1.5} className="empty-heart-icon" />
          </div>
          <h2>Your Wishlist is Empty</h2>
          <p>Explore our latest arrivals, festive collections, and everyday essentials to find pieces you love.</p>
          <Link to="/shop" className="primary-btn empty-wishlist-cta">
            <ShoppingBag size={18} />
            <span>Discover Products</span>
          </Link>
        </div>
      ) : (
        <div className="products-grid">
          {wishlistItems.map((product) => {
            const pId = product.id || product._id;
            return (
              <div className="wishlist-product-card-wrap" key={pId}>
                <ProductCard product={product} />
                <button
                  type="button"
                  className="remove-wishlist-pill-btn"
                  onClick={() => removeFromWishlist(pId)}
                  aria-label={`Remove ${product.name} from wishlist`}
                >
                  Remove from Wishlist
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Wishlist;