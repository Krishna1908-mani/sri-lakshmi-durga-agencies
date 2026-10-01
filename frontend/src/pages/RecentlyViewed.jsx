import { useState } from "react";
import { Link } from "react-router-dom";
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
    <div className="page">
      <div className="page-header">
        <h1>Recently Viewed</h1>
        <p>Products you opened recently</p>
      </div>

      {recentProducts.length === 0 ? (
        <div className="no-products">
          <h2>No recently viewed products</h2>
          <p>Open products from the shop page to see them here.</p>

          <Link to="/shop" className="primary-btn">
            Go to Shop
          </Link>
        </div>
      ) : (
        <>
          <div className="recent-actions">
            <button onClick={clearRecentlyViewed}>Clear Recently Viewed</button>
          </div>

          <div className="products-grid">
            {recentProducts.map((product) => (
              <ProductCard product={product} key={product._id} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default RecentlyViewed;