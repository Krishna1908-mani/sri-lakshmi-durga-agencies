import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  PlusCircle, 
  Search, 
  Edit, 
  Trash2, 
  Package, 
  ArrowLeft,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import API from "../api/axios";
import AdminNavbar from "./AdminNavbar";

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("adminToken");

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await API.get("/products");
      setProducts(res.data.products || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id, name) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete "${name || "this product"}"?`
    );

    if (!confirmDelete) return;

    try {
      await API.delete(`/products/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Product deleted successfully");
      fetchProducts();
    } catch (error) {
      console.log(error);
      alert("Failed to delete product");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.fabric?.toLowerCase().includes(q)
    );
  }, [products, search]);

  return (
    <div className="admin-page-layout">
      <AdminNavbar />

      <main className="admin-main-content">
        {/* Header */}
        <div className="admin-page-top-bar">
          <div>
            <h1>Manage Inventory</h1>
            <p>View, search, edit pricing, or delete catalog items ({products.length} total products)</p>
          </div>

          <div className="top-bar-actions">
            <Link to="/admin/add-product" className="primary-btn">
              <PlusCircle size={16} />
              <span>Add Product</span>
            </Link>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="admin-table-controls">
          <div className="admin-search-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by product name, category, fabric..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search-input"
            />
          </div>
        </div>

        {/* Products Table Card */}
        <div className="admin-table-card">
          <div className="table-responsive-wrapper">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th style={{ width: "80px" }}>Image</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="table-status-cell">
                      <div className="loading-spinner"></div>
                      <span>Loading products...</span>
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="table-empty-cell">
                      <Package size={36} />
                      <p>No products match your search.</p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const productId = product.id || product._id;
                    const isLowStock = Number(product.stock) <= 5;
                    const isOutStock = Number(product.stock) <= 0;

                    return (
                      <tr key={productId}>
                        <td>
                          <div className="product-table-thumb-wrap">
                            <img
                              src={product.image || "https://via.placeholder.com/60"}
                              alt={product.name}
                              className="product-table-thumb"
                            />
                          </div>
                        </td>

                        <td>
                          <div className="product-name-cell">
                            <strong>{product.name}</strong>
                            {product.fabric && (
                              <span className="fabric-subtext">Fabric: {product.fabric}</span>
                            )}
                          </div>
                        </td>

                        <td>
                          <span className="table-category-tag">{product.category || "General"}</span>
                        </td>

                        <td>
                          <div className="table-price-cell">
                            <strong>₹{product.price?.toLocaleString("en-IN")}</strong>
                            {product.oldPrice > product.price && (
                              <span className="table-old-price">₹{product.oldPrice}</span>
                            )}
                          </div>
                        </td>

                        <td>
                          {isOutStock ? (
                            <span className="stock-pill out">Out of Stock (0)</span>
                          ) : isLowStock ? (
                            <span className="stock-pill low">Low ({product.stock})</span>
                          ) : (
                            <span className="stock-pill in">{product.stock} in stock</span>
                          )}
                        </td>

                        <td style={{ textAlign: "right" }}>
                          <div className="table-actions-group">
                            <Link
                              to={`/admin/edit-product/${productId}`}
                              className="action-btn edit"
                              title="Edit product details"
                            >
                              <Edit size={15} />
                              <span>Edit</span>
                            </Link>

                            <button
                              type="button"
                              className="action-btn delete"
                              onClick={() => deleteProduct(productId, product.name)}
                              title="Delete product"
                            >
                              <Trash2 size={15} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminProducts;