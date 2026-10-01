import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import ProductCard from "../components/ProductCard";

function Shop() {
  const [products, setProducts] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await API.get("/products");
      setProducts(res.data.products);
    } catch (error) {
      console.log(error);
      alert("Failed to fetch products");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(products.map((product) => product.category)),
    ];

    return ["All", ...uniqueCategories];
  }, [products]);

  const suggestions = useMemo(() => {
    if (!search.trim()) return [];

    const searchText = search.toLowerCase();

    return products
      .filter((product) => {
        return (
          product.name.toLowerCase().includes(searchText) ||
          product.category.toLowerCase().includes(searchText) ||
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
          product.name.toLowerCase().includes(searchText) ||
          product.category.toLowerCase().includes(searchText) ||
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
    }

    if (sortBy === "high-low") {
      result.sort((a, b) => b.price - a.price);
    }

    if (sortBy === "rating") {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    if (sortBy === "newest") {
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

  return (
    <div className="page">
      <div className="page-header">
        <h1>Shop Products</h1>
        <p>Find your favorite ladies clothing and essentials</p>
      </div>

      <div className="shop-filters">
        <div className="search-suggestion-box">
          <input
            type="text"
            placeholder="Search products, category, fabric..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
          />

          {search && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={clearSearch}
            >
              ×
            </button>
          )}

          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestions-list">
              {suggestions.map((product) => (
                <div
                  className="suggestion-item"
                  key={product._id}
                  onClick={() => selectSuggestion(product)}
                >
                  <img src={product.image} alt={product.name} />

                  <div>
                    <h4>{product.name}</h4>
                    <p>
                      {product.category} | ₹{product.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <input
          type="number"
          placeholder="Max Price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="newest">Newest First</option>
          <option value="low-high">Price Low to High</option>
          <option value="high-low">Price High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>

      <div className="category-filter">
        {categories.map((category) => (
          <button
            key={category}
            className={selectedCategory === category ? "active-category" : ""}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="shop-count">
        <p>
          Showing <strong>{filteredProducts.length}</strong> products
        </p>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="no-products">
          <h2>No products found</h2>
          <p>Try changing search, category or price filter.</p>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map((product) => (
            <ProductCard product={product} key={product._id} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Shop;