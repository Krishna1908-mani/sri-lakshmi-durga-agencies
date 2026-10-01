import { useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import ProductCard from "../components/ProductCard";

function RecentlyViewed() {
  const [recentProducts, setRecentProducts] = useState(() => {
    return JSON.parse(localStorage.getItem("recentlyViewed") || "[]");
  });

  const clearRecentlyViewed = () => {
    localStorage.removeItem("recentlyViewed");
    setRecentProducts([]);
  };

  return (
    <div className="page recently-viewed-page">
      <div className="recent-page-header">
        <div>
          <div className="recent-title-row">
            <h1>Recently Viewed</h1>
            {recentProducts.length > 0 && (
              <span className="recent-count-pill">{recentProducts.length} Products</span>
            )}
          </div>
          <p className="recent-subtitle">Items you recently browsed on Sri Lakshmi Durga Agencies</p>
        </div>

        {recentProducts.length > 0 && (
          <button 
            type="button" 
            onClick={clearRecentlyViewed} 
            className="clear-recent-btn"
            title="Clear browsing history"
          >
            <Trash2 size={15} />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {recentProducts.length === 0 ? (
        <div className="recent-empty-state">
          <div className="empty-recent-illustration">
            <Clock size={48} strokeWidth={1.5} className="empty-recent-icon" />
          </div>
          <h2>No Recently Viewed Products</h2>
          <p>Browse through our collection to see your recently viewed styles appear here.</p>
          <Link to="/shop" className="primary-btn empty-recent-cta">
            <ShoppingBag size={18} />
            <span>Explore Collection</span>
          </Link>
        </div>
      ) : (
        <div className="products-grid">
          {recentProducts.map((product) => (
            <ProductCard product={product} key={product.id || product._id} />
          ))}
        </div>
      )}
    </div>
  );
}

export default RecentlyViewed;