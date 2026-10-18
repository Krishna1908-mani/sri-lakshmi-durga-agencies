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

  // Dynamic SEO & Structured Data Management
  useEffect(() => {
    // 1. Page Title
    const originalTitle = document.title;
    document.title = "Shop Women's Fashion & Clothing | Sri Lakshmi Durga Agencies";

    // 2. Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    let createdCanonical = false;
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
      createdCanonical = true;
    }
    canonicalLink.setAttribute("href", "https://sri-lakshmi-durga-agencies.vercel.app/shop");

    // 3. Open Graph & Twitter Social Cards
    const metaTags = [
      { property: "og:title", content: "Shop Women's Fashion & Clothing | Sri Lakshmi Durga Agencies" },
      { property: "og:description", content: "Sri Lakshmi Durga Agencies - Online ladies clothing, tops, jackets, essentials and fashion store." },
      { property: "og:image", content: "https://sri-lakshmi-durga-agencies.vercel.app/logo.png" },
      { property: "og:url", content: "https://sri-lakshmi-durga-agencies.vercel.app/shop" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Shop Women's Fashion & Clothing | Sri Lakshmi Durga Agencies" },
      { name: "twitter:description", content: "Sri Lakshmi Durga Agencies - Online ladies clothing, tops, jackets, essentials and fashion store." },
      { name: "twitter:image", content: "https://sri-lakshmi-durga-agencies.vercel.app/logo.png" },
    ];

    const createdMetaElements = [];
    metaTags.forEach(({ property, name, content }) => {
      const selector = property ? `meta[property="${property}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector);
      if (!meta) {
        meta = document.createElement("meta");
        if (property) meta.setAttribute("property", property);
        if (name) meta.setAttribute("name", name);
        document.head.appendChild(meta);
        createdMetaElements.push(meta);
      }
      meta.setAttribute("content", content);
    });

    // 4. Schema.org JSON-LD Structured Data
    let schemaScript = document.getElementById("shop-jsonld-schema");
    let createdSchema = false;
    if (!schemaScript) {
      schemaScript = document.createElement("script");
      schemaScript.id = "shop-jsonld-schema";
      schemaScript.type = "application/ld+json";
      document.head.appendChild(schemaScript);
      createdSchema = true;
    }

    const jsonLdData = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Shop Women's Fashion & Clothing | Sri Lakshmi Durga Agencies",
      "description": "Sri Lakshmi Durga Agencies - Online ladies clothing, tops, jackets, essentials and fashion store.",
      "url": "https://sri-lakshmi-durga-agencies.vercel.app/shop",
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://sri-lakshmi-durga-agencies.vercel.app/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Shop",
            "item": "https://sri-lakshmi-durga-agencies.vercel.app/shop"
          }
        ]
      },
      "mainEntity": {
        "@type": "ItemList",
        "itemListElement": filteredProducts.slice(0, 12).map((item, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "url": `https://sri-lakshmi-durga-agencies.vercel.app/product/${item.id || item._id}`,
          "name": item.name
        }))
      }
    };
    schemaScript.textContent = JSON.stringify(jsonLdData);

    return () => {
      document.title = originalTitle;
      if (createdCanonical && canonicalLink && canonicalLink.parentNode) {
        canonicalLink.parentNode.removeChild(canonicalLink);
      }
      createdMetaElements.forEach((el) => {
        if (el && el.parentNode) el.parentNode.removeChild(el);
      });
      if (createdSchema && schemaScript && schemaScript.parentNode) {
        schemaScript.parentNode.removeChild(schemaScript);
      }
    };
  }, [filteredProducts]);

  return (
    <main className="shop-page-wrapper" id="main-content">
      {/* React 19 Document Metadata Hoisting */}
      <title>Shop Women's Fashion & Clothing | Sri Lakshmi Durga Agencies</title>
      <meta name="description" content="Sri Lakshmi Durga Agencies - Online ladies clothing, tops, jackets, essentials and fashion store." />
      <link rel="canonical" href="https://sri-lakshmi-durga-agencies.vercel.app/shop" />
      <meta property="og:title" content="Shop Women's Fashion & Clothing | Sri Lakshmi Durga Agencies" />
      <meta property="og:description" content="Sri Lakshmi Durga Agencies - Online ladies clothing, tops, jackets, essentials and fashion store." />
      <meta property="og:image" content="https://sri-lakshmi-durga-agencies.vercel.app/logo.png" />
      <meta property="og:url" content="https://sri-lakshmi-durga-agencies.vercel.app/shop" />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Shop Women's Fashion & Clothing | Sri Lakshmi Durga Agencies" />
      <meta name="twitter:description" content="Sri Lakshmi Durga Agencies - Online ladies clothing, tops, jackets, essentials and fashion store." />
      <meta name="twitter:image" content="https://sri-lakshmi-durga-agencies.vercel.app/logo.png" />

      {/* Header Banner */}
      <header className="shop-header">
        <div className="shop-header-badge">
          <Sparkles size={14} className="badge-sparkle-icon" aria-hidden="true" />
          <span>Curated Collection</span>
        </div>
        <h1 className="shop-title">Shop Products</h1>
        <p className="shop-subtitle">Find your favorite ladies clothing, kurtis, dresses, and daily essentials</p>
        <p className="shop-intro-desc">
          Explore our handcrafted collection of authentic Indian ethnic wear, contemporary kurtis, designer dresses, stylish tops, and everyday essentials. Sourced with premium fabrics and offered at direct wholesale and retail pricing with fast, reliable dispatch across India.
        </p>
      </header>

      {/* Main Control Suite (Search & Filters) */}
      <section className="shop-controls-card" aria-label="Product Search and Filters">
        <div className="shop-controls-grid">
          {/* Search Box with Instant Suggestions */}
          <div className="search-control-wrapper">
            <div className="search-input-field">
              <label htmlFor="shop-search-input" className="sr-only">
                Search products
              </label>
              <Search size={18} className="search-icon-prefix" aria-hidden="true" />
              <input
                id="shop-search-input"
                type="search"
                name="search"
                placeholder="Search by name, category, fabric..."
                aria-label="Search products"
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
                  <X size={15} aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Suggestions Overlay */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="suggestions-dropdown" role="region" aria-label="Search suggestions">
                <div className="suggestions-header">Quick Results</div>
                {suggestions.map((product) => (
                  <div
                    className="suggestion-row"
                    key={product.id || product._id}
                    onClick={() => selectSuggestion(product)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        selectSuggestion(product);
                      }
                    }}
                  >
                    <img 
                      src={product.image || product.imageUrl || "https://via.placeholder.com/60"} 
                      alt="" 
                      className="suggestion-thumb" 
                      aria-hidden="true"
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
              <label htmlFor="max-price-input" className="sr-only">
                Filter by maximum price
              </label>
              <IndianRupee size={16} className="input-prefix-icon" aria-hidden="true" />
              <input
                id="max-price-input"
                type="number"
                name="maxPrice"
                placeholder="Max Price"
                aria-label="Filter products by maximum price"
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
              <label htmlFor="sort-by-select" className="sr-only">
                Sort products
              </label>
              <ArrowUpDown size={16} className="input-prefix-icon" aria-hidden="true" />
              <select 
                id="sort-by-select"
                name="sortBy"
                aria-label="Filter and sort products"
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
              aria-label="Reset all active search and filter options"
            >
              <RotateCcw size={15} aria-hidden="true" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Category Pills Navigation */}
        <div className="category-chips-scroll" role="group" aria-label="Filter by category">
          <div className="category-chips-track">
            {categories.map((category) => {
              const isActive = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  className={`category-chip ${isActive ? "active" : ""}`}
                  onClick={() => setSelectedCategory(category)}
                  aria-pressed={isActive}
                >
                  {isActive && <Check size={14} className="chip-check-icon" aria-hidden="true" />}
                  <span>{category}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Results Bar */}
      <div className="shop-results-bar" aria-live="polite">
        <div className="results-count-pill">
          <SlidersHorizontal size={14} className="results-icon" aria-hidden="true" />
          <span>Showing <strong>{filteredProducts.length}</strong> {filteredProducts.length === 1 ? "product" : "products"}</span>
        </div>
        {selectedCategory !== "All" && (
          <span className="active-category-indicator">
            in <strong>{selectedCategory}</strong>
          </span>
        )}
      </div>

      {/* Catalog Section with semantic H2 heading */}
      <section className="shop-catalog-section" aria-label="Product Catalog">
        <h2 className="sr-only">Available Collection</h2>

        {/* Products Grid or Empty State */}
        {loading ? (
          <div className="shop-loading-state" role="status" aria-live="polite">
            <div className="loading-spinner"></div>
            <p>Loading handpicked products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="shop-empty-state">
            <div className="empty-state-icon-box">
              <ShoppingBag size={48} strokeWidth={1.5} className="empty-state-icon" aria-hidden="true" />
            </div>
            <h2 className="empty-state-title">No matching products found</h2>
            <p>We couldn't find any items matching your current filters. Try changing your search query or price limit.</p>
            <button type="button" onClick={resetAllFilters} className="empty-reset-btn">
              <RotateCcw size={16} aria-hidden="true" />
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
      </section>
    </main>
  );
}

export default Shop;