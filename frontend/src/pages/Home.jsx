import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Sparkles, 
  ShoppingBag, 
  TrendingUp, 
  Truck, 
  Compass, 
  ShieldCheck, 
  MessageCircle, 
  ArrowRight,
  Star,
  CheckCircle2,
  Tag
} from "lucide-react";
import API from "../api/axios";
import ProductCard from "../components/ProductCard";

function Home() {
  const [products, setProducts] = useState([]);

  const [banner, setBanner] = useState({
    smallText: "Welcome to Sri Lakshmi Durga Agencies",
    title: "Elegant Ladies Clothing & Essentials",
    description:
      "Shop beautiful kurtis, dresses, tops, essentials and accessories at affordable wholesale & retail prices.",
    offerText: "Up to 40% OFF",
    image: "",
  });

  const fetchProducts = async () => {
    try {
      const res = await API.get("/products");
      setProducts(res.data.products || []);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchBanner = async () => {
    try {
      const res = await API.get("/home-banner");
      if (res.data.banner) {
        setBanner(res.data.banner);
      }
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
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge-pill">
            <Sparkles size={14} className="hero-badge-icon" />
            <span>{banner.smallText}</span>
          </div>

          <h1 className="hero-heading">{banner.title}</h1>

          <p className="hero-desc">{banner.description}</p>

          <div className="hero-buttons">
            <Link to="/shop" className="primary-btn hero-primary-btn">
              <ShoppingBag size={18} />
              <span>Shop Now</span>
            </Link>

            <Link to="/track-order" className="secondary-btn hero-secondary-btn">
              <Compass size={18} />
              <span>Track Order</span>
            </Link>
          </div>

          <div className="hero-trust-bullets">
            <div className="trust-bullet">
              <CheckCircle2 size={16} className="bullet-icon" />
              <span>100% Quality Guaranteed</span>
            </div>
            <div className="trust-bullet">
              <CheckCircle2 size={16} className="bullet-icon" />
              <span>Cash on Delivery</span>
            </div>
          </div>
        </div>

        <div className="hero-card">
          {banner.image ? (
            <img src={banner.image} alt="Home Banner" className="hero-img" />
          ) : (
            <div className="hero-card-placeholder">
              <div className="placeholder-icon-ring">
                <Sparkles size={32} />
              </div>
              <h2>Festival Collection</h2>
              <p>Exclusive fabrics & handcrafted elegance</p>
            </div>
          )}

          <div className="hero-offer-tag">
            <Tag size={14} />
            <span>{banner.offerText}</span>
          </div>
        </div>
      </section>

      {/* Categories Showcase */}
      <section className="home-categories-section">
        <div className="section-title text-center">
          <div>
            <span className="section-eyebrow">Explore Styles</span>
            <h2>Popular Categories</h2>
          </div>
        </div>

        <div className="home-categories">
          <Link to="/shop" className="home-category-card">
            <div className="category-icon-wrapper cat-pink">
              <Sparkles size={24} />
            </div>
            <h3>Kurtis</h3>
            <p>Comfortable daily & festive wear</p>
            <span className="category-browse-arrow">
              <span>Explore</span>
              <ArrowRight size={14} />
            </span>
          </Link>

          <Link to="/shop" className="home-category-card">
            <div className="category-icon-wrapper cat-purple">
              <TrendingUp size={24} />
            </div>
            <h3>Dresses</h3>
            <p>Modern silhouettes & flowy elegance</p>
            <span className="category-browse-arrow">
              <span>Explore</span>
              <ArrowRight size={14} />
            </span>
          </Link>

          <Link to="/shop" className="home-category-card">
            <div className="category-icon-wrapper cat-emerald">
              <ShoppingBag size={24} />
            </div>
            <h3>Tops & Tunics</h3>
            <p>Chic everyday office & casual picks</p>
            <span className="category-browse-arrow">
              <span>Explore</span>
              <ArrowRight size={14} />
            </span>
          </Link>

          <Link to="/shop" className="home-category-card">
            <div className="category-icon-wrapper cat-amber">
              <Star size={24} />
            </div>
            <h3>Essentials</h3>
            <p>Leggings, dupattas & daily basics</p>
            <span className="category-browse-arrow">
              <span>Explore</span>
              <ArrowRight size={14} />
            </span>
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      <section className="home-section">
        <div className="section-title">
          <div>
            <span className="section-eyebrow">Handpicked Selection</span>
            <h2>Featured Products</h2>
          </div>
          <Link to="/shop" className="view-all-link">
            <span>View All Collection</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="products-grid">
          {featuredProducts.map((product) => (
            <ProductCard product={product} key={product.id || product._id} />
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="home-section alt-bg">
        <div className="section-title">
          <div>
            <span className="section-eyebrow">Just Dropped</span>
            <h2>New Arrivals</h2>
          </div>
          <Link to="/shop" className="view-all-link">
            <span>View All Collection</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="products-grid">
          {newArrivals.map((product) => (
            <ProductCard product={product} key={product.id || product._id} />
          ))}
        </div>
      </section>

      {/* Top Rated Section */}
      {bestRated.length > 0 && (
        <section className="home-section">
          <div className="section-title">
            <div>
              <span className="section-eyebrow">Customer Favorites</span>
              <h2>Top Rated Styles</h2>
            </div>
            <Link to="/shop" className="view-all-link">
              <span>View All Collection</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="products-grid">
            {bestRated.map((product) => (
              <ProductCard product={product} key={product.id || product._id} />
            ))}
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="why-section">
        <div className="why-card">
          <div className="why-icon-box">
            <Truck size={24} className="why-svg" />
          </div>
          <h3>Fast Delivery</h3>
          <p>Carefully packed & rapidly dispatched across all Indian states.</p>
        </div>

        <div className="why-card">
          <div className="why-icon-box">
            <Compass size={24} className="why-svg" />
          </div>
          <h3>Real-Time Tracking</h3>
          <p>Track your package easily with live status updates anytime.</p>
        </div>

        <div className="why-card">
          <div className="why-icon-box">
            <ShieldCheck size={24} className="why-svg" />
          </div>
          <h3>Secure Checkout</h3>
          <p>Safe digital payments via Razorpay and verified Cash on Delivery.</p>
        </div>

        <div className="why-card">
          <div className="why-icon-box">
            <MessageCircle size={24} className="why-svg" />
          </div>
          <h3>WhatsApp Support</h3>
          <p>Instant personal assistance for fabric, sizing, and order details.</p>
        </div>
      </section>
    </div>
  );
}

export default Home;