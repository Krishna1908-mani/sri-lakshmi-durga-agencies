import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import API from "../api/axios";

function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("adminToken");

  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    category: "Tops",
    price: "",
    oldPrice: "",
    sizes: "",
    colors: "",
    fabric: "",
    stock: "",
    image: "",
    description: "",
  });

  const fetchProduct = useCallback(async () => {
    try {
      const res = await API.get(`/products/${id}`);
      const product = res.data.product;

      setForm({
        name: product.name || "",
        category: product.category || "Tops",
        price: product.price || "",
        oldPrice: product.oldPrice || "",
        sizes: product.sizes ? product.sizes.join(",") : "",
        colors: product.colors ? product.colors.join(",") : "",
        fabric: product.fabric || "",
        stock: product.stock || "",
        image: product.image || "",
        description: product.description || "",
      });
    } catch (error) {
      console.log(error);
      alert("Failed to fetch product");
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const uploadImage = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    try {
      setUploading(true);

      const imageData = new FormData();
      imageData.append("image", file);

      const res = await API.post("/upload/product-image", imageData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setForm({ ...form, image: res.data.imageUrl });
      alert("New image uploaded successfully");
    } catch (error) {
      console.log(error);
      alert("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const updateProduct = async (e) => {
    e.preventDefault();

    if (!form.image) {
      alert("Product image is required");
      return;
    }

    try {
      const productData = {
        name: form.name,
        category: form.category,
        price: Number(form.price),
        oldPrice: Number(form.oldPrice),
        sizes: form.sizes.split(",").map((item) => item.trim()),
        colors: form.colors.split(",").map((item) => item.trim()),
        fabric: form.fabric,
        stock: Number(form.stock),
        image: form.image,
        description: form.description,
      };

      await API.put(`/products/${id}`, productData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Product updated successfully");
      navigate("/admin/products");
    } catch (error) {
      console.log(error);
      alert("Failed to update product");
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>Edit Product</h1>
          <p>Update product details and image</p>
        </div>

        <Link to="/admin/products" className="back-btn">
          Back
        </Link>
      </div>

      <form className="admin-form" onSubmit={updateProduct}>
        <input
          name="name"
          placeholder="Product Name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <select name="category" value={form.category} onChange={handleChange}>
          <option value="Tops">Tops</option>
          <option value="Jackets">Jackets</option>
          <option value="Kurtis">Kurtis</option>
          <option value="Dresses">Dresses</option>
          <option value="Essentials">Essentials</option>
          <option value="Accessories">Accessories</option>
        </select>

        <input
          name="price"
          type="number"
          placeholder="Selling Price"
          value={form.price}
          onChange={handleChange}
          required
        />

        <input
          name="oldPrice"
          type="number"
          placeholder="Old Price"
          value={form.oldPrice}
          onChange={handleChange}
        />

        <input
          name="sizes"
          placeholder="Sizes example: S,M,L,XL"
          value={form.sizes}
          onChange={handleChange}
        />

        <input
          name="colors"
          placeholder="Colors example: Pink,Black,White"
          value={form.colors}
          onChange={handleChange}
        />

        <input
          name="fabric"
          placeholder="Fabric example: Cotton"
          value={form.fabric}
          onChange={handleChange}
        />

        <input
          name="stock"
          type="number"
          placeholder="Stock Quantity"
          value={form.stock}
          onChange={handleChange}
          required
        />

        <div className="image-upload-box">
          <label>Change Product Image</label>

          <input type="file" accept="image/*" onChange={uploadImage} />

          {uploading && <p>Uploading new image...</p>}

          {form.image && (
            <img src={form.image} alt="Preview" className="image-preview" />
          )}
        </div>

        <input
          name="image"
          placeholder="Product Image URL"
          value={form.image}
          onChange={handleChange}
          required
        />

        <textarea
          name="description"
          placeholder="Product Description"
          value={form.description}
          onChange={handleChange}
        />

        <button type="submit">Update Product</button>
      </form>
    </div>
  );
}

export default EditProduct;