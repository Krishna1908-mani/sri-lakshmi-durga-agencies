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
  Check,
  ShieldCheck,
  Truck,
  MessageCircle
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

  const hasActiveFilters = Boolean(
    search.trim() || selectedCategory !== "All" || maxPrice || sortBy !== "newest"
  );

  // Dynamic SEO & Structured Data Management with Strict Head Deduplication
  useEffect(() => {
    // 1. Page Title: Set target title and purge any duplicate <title> tags in <head>
    const originalTitle = "Sri Lakshmi Durga Agencies";
    const targetTitle = "Shop Women's Fashion & Clothing | Sri Lakshmi Durga Agencies";
    document.title = targetTitle;
    const existingTitles = document.head.querySelectorAll("title");
    for (let i = 1; i < existingTitles.length; i++) {
      existingTitles[i].remove();
    }

    // 2. Meta Description: Update existing primary tag and purge any duplicates
    const shopMetaDesc = "Shop handcrafted Indian ethnic wear, designer kurtis, dresses, tops & daily essentials. Premium fabrics, verified quality, wholesale & retail pricing across India.";
    const existingDescriptions = document.head.querySelectorAll('meta[name="description"]');
    if (existingDescriptions.length > 0) {
      existingDescriptions[0].setAttribute("content", shopMetaDesc);
      for (let i = 1; i < existingDescriptions.length; i++) {
        existingDescriptions[i].remove();
      }
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = shopMetaDesc;
      document.head.appendChild(meta);
    }

    // 3. Canonical URL: Set target canonical and purge any duplicates
    const canonicalUrl = "https://sri-lakshmi-durga-agencies.vercel.app/shop";
    const existingCanonicals = document.head.querySelectorAll('link[rel="canonical"]');
    if (existingCanonicals.length > 0) {
      existingCanonicals[0].setAttribute("href", canonicalUrl);
      for (let i = 1; i < existingCanonicals.length; i++) {
        existingCanonicals[i].remove();
      }
    } else {
      const canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      canonicalLink.setAttribute("href", canonicalUrl);
      document.head.appendChild(canonicalLink);
    }

    // 4. Open Graph & Twitter Social Cards: Guarantee exactly one tag per property/name
    const metaTags = [
      { property: "og:title", content: targetTitle },
      { property: "og:description", content: shopMetaDesc },
      { property: "og:image", content: "https://sri-lakshmi-durga-agencies.vercel.app/logo.png" },
      { property: "og:url", content: canonicalUrl },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: targetTitle },
      { name: "twitter:description", content: shopMetaDesc },
      { name: "twitter:image", content: "https://sri-lakshmi-durga-agencies.vercel.app/logo.png" },
    ];

    metaTags.forEach(({ property, name, content }) => {
      const selector = property ? `meta[property="${property}"]` : `meta[name="${name}"]`;
      const matches = document.head.querySelectorAll(selector);
      let targetMeta;
      if (matches.length > 0) {
        targetMeta = matches[0];
        for (let i = 1; i < matches.length; i++) {
          matches[i].remove();
        }
      } else {
        targetMeta = document.createElement("meta");
        if (property) targetMeta.setAttribute("property", property);
        if (name) targetMeta.setAttribute("name", name);
        document.head.appendChild(targetMeta);
      }
      targetMeta.setAttribute("content", content);
    });

    // 5. Schema.org JSON-LD Structured Data
    let schemaScript = document.getElementById("shop-jsonld-schema");
    if (!schemaScript) {
      schemaScript = document.createElement("script");
      schemaScript.id = "shop-jsonld-schema";
      schemaScript.type = "application/ld+json";
      document.head.appendChild(schemaScript);
    }

    const jsonLdData = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": targetTitle,
      "description": shopMetaDesc,
      "url": canonicalUrl,
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
            "item": canonicalUrl
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
      const defaultDesc = document.head.querySelector('meta[name="description"]');
      if (defaultDesc) {
        defaultDesc.setAttribute("content", "Sri Lakshmi Durga Agencies - Online ladies clothing, tops, jackets, essentials and fashion store.");
      }
      if (schemaScript && schemaScript.parentNode) {
        schemaScript.parentNode.removeChild(schemaScript);
      }
    };
  }, [filteredProducts]);

  return (
    <main className="shop-page-wrapper" id="main-content">
      {/* Header Banner */}
      <header className="shop-header">
        <div className="shop-header-badge">
          <Sparkles size={14} className="badge-sparkle-icon" aria-hidden="true" />
          <span>Curated Collection</span>
        </div>
        <h1 className="shop-title">Shop Products</h1>
        <p className="shop-subtitle">Find your favorite ladies clothing, kurtis, dresses, and daily essentials</p>
        
        <div className="shop-intro-content">
          <p className="shop-intro-desc">
            Welcome to Sri Lakshmi Durga Agencies, your trusted destination for premium Indian ethnic wear and contemporary ladies fashion. Explore our handpicked collection of traditional designer kurtis, elegant dresses, stylish office-wear tops, flowy tunics, and comfortable daily essentials designed to combine timeless Indian aesthetics with everyday versatility.
          </p>
          <p className="shop-intro-desc">
            Every piece in our catalog is tailored from skin-friendly, high-grade fabrics including breathable pure cotton, rich rayon, chanderi silk, and lightweight georgette. Whether purchasing for daily wear, festive occasions, or wholesale retail distribution, we guarantee 100% verified quality, authentic stitching, transparent sizing, and prompt doorstep delivery across all Indian states with Cash on Delivery (COD) and secure prepaid payments.
          </p>
        </div>
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

      {/* Shopping Guide, Fabric Care & FAQ Section */}
      <section className="shop-guide-section" aria-label="Fabric Care, Quality and Shipping Guide">
        <div className="shop-guide-header">
          <span className="section-eyebrow">Customer Guide</span>
          <h2>Fabric Care, Sizing & Shipping Details</h2>
          <p>Everything you need to know about our garment quality, sizing accuracy, and pan-India shipping.</p>
        </div>

        <div className="shop-guide-grid">
          <div className="shop-guide-card">
            <div className="guide-card-icon">
              <ShieldCheck size={20} aria-hidden="true" />
            </div>
            <h3>100% Quality & Color-Fast Fabrics</h3>
            <p>
              Our kurtis, dresses, and tops use pre-tested, color-fast dyes on breathable natural cottons and premium rayons. They resist fading and shrinking with standard gentle cold-water washing.
            </p>
          </div>

          <div className="shop-guide-card">
            <div className="guide-card-icon">
              <Sparkles size={20} aria-hidden="true" />
            </div>
            <h3>True-to-Fit Indian Sizing</h3>
            <p>
              Each design is tailored to accurate Indian body sizing standards (S through 3XL). For custom sizing recommendations, reach our helpdesk with your chest and waist measurements.
            </p>
          </div>

          <div className="shop-guide-card">
            <div className="guide-card-icon">
              <Truck size={20} aria-hidden="true" />
            </div>
            <h3>Fast Pan-India Doorstep Dispatch</h3>
            <p>
              Orders are packaged within 24 business hours. Enjoy insured express delivery across Andhra Pradesh, Telangana, Karnataka, Tamil Nadu, and all Indian pincodes with live SMS tracking.
            </p>
          </div>

          <div className="shop-guide-card">
            <div className="guide-card-icon">
              <MessageCircle size={20} aria-hidden="true" />
            </div>
            <h3>Wholesale & Personal WhatsApp Support</h3>
            <p>
              Need bulk wholesale pricing or help placing an order? Our support team is available on WhatsApp at +91 9949677382 for instant sizing, fabric pictures, and order assistance.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Shop;