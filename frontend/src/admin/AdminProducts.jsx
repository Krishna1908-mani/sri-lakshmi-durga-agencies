import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const token = localStorage.getItem("adminToken");

  const fetchProducts = async () => {
    try {
      const res = await API.get("/products");
      setProducts(res.data.products);
    } catch (error) {
      console.log(error);
    }
  };

  const deleteProduct = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?"
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

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>Manage Products</h1>
          <p>View, edit and delete products</p>
        </div>

        <div className="admin-header-actions">
          <Link to="/admin/add-product" className="back-btn">
            Add Product
          </Link>

          <Link to="/admin/dashboard" className="back-btn">
            Dashboard
          </Link>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => (
              <tr key={product._id}>
                <td>
                  <img src={product.image} alt={product.name} />
                </td>

                <td>{product.name}</td>
                <td>{product.category}</td>
                <td>₹{product.price}</td>
                <td>{product.stock}</td>

                <td>
                  <div className="table-actions">
                    <Link
                      to={`/admin/edit-product/${product._id}`}
                      className="edit-btn"
                    >
                      Edit
                    </Link>

                    <button
                      className="delete-btn"
                      onClick={() => deleteProduct(product._id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {products.length === 0 && <p>No products found.</p>}
      </div>
    </div>
  );
}

export default AdminProducts;