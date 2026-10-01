import { useEffect, useMemo, useState } from "react";
import { 
  Search, 
  SlidersHorizontal, 
  ArrowUpDown, 
  IndianRupee, 
  X, 
  Sparkles, 
  ShoppingBag, 
  RotateCcw,
  Check
} from "lucide-react";
import API from "../api/axios";
import ProductCard from "../components/ProductCard";

function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await API.get("/products");
      setProducts(res.data.products || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(products.map((product) => product.category).filter(Boolean)),
    ];
    return ["All", ...uniqueCategories];
  }, [products]);

  const suggestions = useMemo(() => {
    if (!search.trim()) return [];
    const searchText = search.toLowerCase();

    return products
      .filter((product) => {
        return (
          product.name?.toLowerCase().includes(searchText) ||
          product.category?.toLowerCase().includes(searchText) ||
          product.fabric?.toLowerCase().includes(searchText)
        );
      })
      .slice(0, 6);
  }, [search, products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedCategory !== "All") {
      result = result.filter(
        (product) => product.category === selectedCategory
      );
    }

    if (search.trim()) {
      const searchText = search.toLowerCase();
      result = result.filter((product) => {
        return (
          product.name?.toLowerCase().includes(searchText) ||
          product.category?.toLowerCase().includes(searchText) ||
          product.fabric?.toLowerCase().includes(searchText) ||
          product.description?.toLowerCase().includes(searchText)
        );
      });
    }

    if (maxPrice) {
      result = result.filter((product) => product.price <= Number(maxPrice));
    }

    if (sortBy === "low-high") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "high-low") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating") {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return result;
  }, [products, selectedCategory, search, maxPrice, sortBy]);

  const selectSuggestion = (product) => {
    setSearch(product.name);
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearch("");
    setShowSuggestions(false);
  };

  const resetAllFilters = () => {
    setSearch("");
    setSelectedCategory("All");
    setMaxPrice("");
    setSortBy("newest");
    setShowSuggestions(false);
  };

  const hasActiveFilters = search || selectedCategory !== "All" || maxPrice || sortBy !== "newest";

  return (
    <div className="shop-page-wrapper">
      {/* Header Banner */}
      <div className="shop-header">
        <div className="shop-header-badge">
          <Sparkles size={14} className="badge-sparkle-icon" />
          <span>Curated Collection</span>
        </div>
        <h1 className="shop-title">Shop Products</h1>
        <p className="shop-subtitle">Find your favorite ladies clothing, kurtis, dresses, and daily essentials</p>
      </div>

      {/* Main Control Suite (Search & Filters) */}
      <div className="shop-controls-card">
        <div className="shop-controls-grid">
          {/* Search Box with Instant Suggestions */}
          <div className="search-control-wrapper">
            <div className="search-input-field">
              <Search size={18} className="search-icon-prefix" />
              <input
                type="text"
                placeholder="Search by name, category, fabric..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="search-input"
              />
              {search && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={clearSearch}
                  aria-label="Clear search text"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Suggestions Overlay */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="suggestions-dropdown">
                <div className="suggestions-header">Quick Results</div>
                {suggestions.map((product) => (
                  <div
                    className="suggestion-row"
                    key={product.id || product._id}
                    onClick={() => selectSuggestion(product)}
                  >
                    <img 
                      src={product.image || product.imageUrl || "https://via.placeholder.com/60"} 
                      alt={product.name}
                      className="suggestion-thumb" 
                    />
                    <div className="suggestion-details">
                      <span className="suggestion-name">{product.name}</span>
                      <div className="suggestion-meta">
                        <span className="suggestion-category">{product.category}</span>
                        <span className="suggestion-price">₹{product.price}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Price Filter with Icon */}
          <div className="filter-input-group price-group">
            <div className="input-with-icon">
              <IndianRupee size={16} className="input-prefix-icon" />
              <input
                type="number"
                placeholder="Max Price"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="filter-input"
                min="0"
              />
            </div>
          </div>

          {/* Sort By Dropdown */}
          <div className="filter-input-group sort-group">
            <div className="select-with-icon">
              <ArrowUpDown size={16} className="input-prefix-icon" />
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="newest">Newest First</option>
                <option value="low-high">Price: Low to High</option>
                <option value="high-low">Price: High to Low</option>
                <option value="rating">Top Customer Rated</option>
              </select>
            </div>
          </div>

          {/* Reset Filters (Only when active) */}
          {hasActiveFilters && (
            <button 
              type="button" 
              onClick={resetAllFilters} 
              className="btn-reset-filters"
              title="Reset all filters"
            >
              <RotateCcw size={15} />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Category Pills Navigation */}
        <div className="category-chips-scroll">
          <div className="category-chips-track">
            {categories.map((category) => {
              const isActive = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  className={`category-chip ${isActive ? "active" : ""}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {isActive && <Check size={14} className="chip-check-icon" />}
                  <span>{category}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results Bar */}
      <div className="shop-results-bar">
        <div className="results-count-pill">
          <SlidersHorizontal size={14} className="results-icon" />
          <span>Showing <strong>{filteredProducts.length}</strong> {filteredProducts.length === 1 ? "product" : "products"}</span>
        </div>
        {selectedCategory !== "All" && (
          <span className="active-category-indicator">
            in <strong>{selectedCategory}</strong>
          </span>
        )}
      </div>

      {/* Products Grid or Empty State */}
      {loading ? (
        <div className="shop-loading-state">
          <div className="loading-spinner"></div>
          <p>Loading handpicked products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="shop-empty-state">
          <div className="empty-state-icon-box">
            <ShoppingBag size={48} strokeWidth={1.5} className="empty-state-icon" />
          </div>
          <h3>No matching products found</h3>
          <p>We couldn't find any items matching your current filters. Try changing your search query or price limit.</p>
          <button type="button" onClick={resetAllFilters} className="empty-reset-btn">
            <RotateCcw size={16} />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map((product) => (
            <ProductCard product={product} key={product.id || product._id} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Shop;