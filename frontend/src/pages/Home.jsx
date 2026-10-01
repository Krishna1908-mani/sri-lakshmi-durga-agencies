import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import ProductCard from "../components/ProductCard";

function Home() {
  const [products, setProducts] = useState([]);

  const [banner, setBanner] = useState({
    smallText: "Welcome to Sri Lakshmi Durga Agencies",
    title: "Elegant Ladies Clothing & Essentials",
    description:
      "Shop beautiful kurtis, dresses, tops, essentials and accessories at affordable prices.",
    offerText: "Up to 40% OFF",
    image: "",
  });

  const fetchProducts = async () => {
    try {
      const res = await API.get("/products");
      setProducts(res.data.products);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchBanner = async () => {
    try {
      const res = await API.get("/home-banner");
      setBanner(res.data.banner);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchBanner();
  }, []);

  const newArrivals = useMemo(() => {
    return [...products]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 4);
  }, [products]);

  const bestRated = useMemo(() => {
    return [...products]
      .filter((product) => product.rating > 0)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 4);
  }, [products]);

  const featuredProducts = useMemo(() => {
    return products.slice(0, 4);
  }, [products]);

  return (
    <div>
      <section className="hero-section">
        <div className="hero-content">
          <p className="hero-small">{banner.smallText}</p>

          <h1>{banner.title}</h1>

          <p>{banner.description}</p>

          <div className="hero-buttons">
            <Link to="/shop" className="primary-btn">
              Shop Now
            </Link>

            <Link to="/track-order" className="secondary-btn">
              Track Order
            </Link>
          </div>
        </div>

        <div className="hero-card">
          {banner.image ? (
            <img src={banner.image} alt="Home Banner" className="hero-img" />
          ) : (
            <>
              <h2>New Collection</h2>
              <p>Fresh styles added regularly</p>
            </>
          )}

          <span>{banner.offerText}</span>
        </div>
      </section>

      <section className="home-categories">
        <div>
          <h3>Kurtis</h3>
          <p>Comfortable daily wear</p>
        </div>

        <div>
          <h3>Dresses</h3>
          <p>Modern and elegant</p>
        </div>

        <div>
          <h3>Tops</h3>
          <p>Trendy collections</p>
        </div>

        <div>
          <h3>Essentials</h3>
          <p>Daily useful products</p>
        </div>
      </section>

      <section className="home-section">
        <div className="section-title">
          <h2>Featured Products</h2>
          <Link to="/shop">View All</Link>
        </div>

        <div className="products-grid">
          {featuredProducts.map((product) => (
            <ProductCard product={product} key={product._id} />
          ))}
        </div>
      </section>

      <section className="home-section">
        <div className="section-title">
          <h2>New Arrivals</h2>
          <Link to="/shop">View All</Link>
        </div>

        <div className="products-grid">
          {newArrivals.map((product) => (
            <ProductCard product={product} key={product._id} />
          ))}
        </div>
      </section>

      {bestRated.length > 0 && (
        <section className="home-section">
          <div className="section-title">
            <h2>Best Rated Products</h2>
            <Link to="/shop">View All</Link>
          </div>

          <div className="products-grid">
            {bestRated.map((product) => (
              <ProductCard product={product} key={product._id} />
            ))}
          </div>
        </section>
      )}

      <section className="why-section">
        <div>
          <h3>Fast Delivery</h3>
          <p>Quick and safe delivery support.</p>
        </div>

        <div>
          <h3>Easy Order Tracking</h3>
          <p>Track your order anytime using order ID.</p>
        </div>

        <div>
          <h3>Secure Payment</h3>
          <p>COD and Razorpay online payment available.</p>
        </div>

        <div>
          <h3>WhatsApp Support</h3>
          <p>Contact us directly for product help.</p>
        </div>
      </section>
    </div>
  );
}

export default Home;