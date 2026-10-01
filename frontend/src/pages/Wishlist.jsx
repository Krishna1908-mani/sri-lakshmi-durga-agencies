import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useWishlist } from "../context/WishlistContext";

function Wishlist() {
  const { wishlistItems, removeFromWishlist } = useWishlist();

  return (
    <div className="page">
      <div className="page-header">
        <h1>My Wishlist</h1>
        <p>Your favorite products saved in one place</p>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="no-products">
          <h2>No wishlist products</h2>
          <p>Add products to wishlist from the shop page.</p>

          <Link to="/shop" className="primary-btn">
            Go to Shop
          </Link>
        </div>
      ) : (
        <div className="products-grid">
          {wishlistItems.map((product) => (
            <div className="wishlist-product-box" key={product._id}>
              <ProductCard product={product} />

              <button
                className="remove-wishlist-btn"
                onClick={() => removeFromWishlist(product._id)}
              >
                Remove from Wishlist
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Wishlist;