import { useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Heart, 
  ShoppingBag, 
  ArrowRight, 
  Sparkles, 
  Shirt, 
  Layers, 
  Package, 
  ShieldCheck, 
  Bell, 
  Truck 
} from "lucide-react";
import ProductCard from "../components/ProductCard";
import { useWishlist } from "../context/WishlistContext";

function Wishlist() {
  const { wishlistItems, removeFromWishlist } = useWishlist();

  // Dynamic SEO, Metadata & Structured Data Management
  useEffect(() => {
    // 1. Page Title: Set target title and purge any duplicate <title> tags
    const originalTitle = "Sri Lakshmi Durga Agencies";
    const targetTitle = "My Wishlist | Sri Lakshmi Durga Agencies";
    document.title = targetTitle;
    const existingTitles = document.head.querySelectorAll("title");
    for (let i = 1; i < existingTitles.length; i++) {
      existingTitles[i].remove();
    }

    // 2. Meta Description: Update existing primary tag and purge any duplicates
    const wishlistMetaDesc = "View and manage your saved items at Sri Lakshmi Durga Agencies.";
    const existingDescriptions = document.head.querySelectorAll('meta[name="description"]');
    if (existingDescriptions.length > 0) {
      existingDescriptions[0].setAttribute("content", wishlistMetaDesc);
      for (let i = 1; i < existingDescriptions.length; i++) {
        existingDescriptions[i].remove();
      }
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = wishlistMetaDesc;
      document.head.appendChild(meta);
    }

    // 3. Canonical Link: Set target canonical and purge any duplicates
    const canonicalUrl = "https://sri-lakshmi-durga-agencies.vercel.app/wishlist";
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
      { property: "og:description", content: wishlistMetaDesc },
      { property: "og:url", content: canonicalUrl },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://sri-lakshmi-durga-agencies.vercel.app/logo.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: targetTitle },
      { name: "twitter:description", content: wishlistMetaDesc },
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

    // 5. BreadcrumbList JSON-LD Structured Data
    let schemaScript = document.getElementById("wishlist-jsonld-schema");
    if (!schemaScript) {
      schemaScript = document.createElement("script");
      schemaScript.id = "wishlist-jsonld-schema";
      schemaScript.type = "application/ld+json";
      document.head.appendChild(schemaScript);
    }

    const breadcrumbJsonLd = {
      "@context": "https://schema.org",
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
          "name": "My Wishlist",
          "item": canonicalUrl
        }
      ]
    };
    schemaScript.textContent = JSON.stringify(breadcrumbJsonLd);

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
  }, []);

  return (
    <main className="page wishlist-page" id="main-content">
      <div className="wishlist-header">
        <div>
          <div className="wishlist-title-row">
            <h1>My Wishlist</h1>
            {wishlistItems.length > 0 && (
              <span className="wishlist-count-badge">
                {wishlistItems.length} {wishlistItems.length === 1 ? "Item" : "Items"}
              </span>
            )}
          </div>
          <p className="wishlist-subtitle">Save your favorite pieces and styles to shop whenever you're ready</p>
        </div>

        {wishlistItems.length > 0 && (
          <Link to="/shop" className="wishlist-browse-link">
            <span>Explore More Styles</span>
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        )}
      </div>

      {wishlistItems.length === 0 ? (
        <div className="wishlist-empty-state">
          <div className="empty-wishlist-illustration">
            <Heart size={48} strokeWidth={1.5} className="empty-heart-icon" aria-hidden="true" />
          </div>
          <h2>Your Wishlist is Empty</h2>
          <p>Explore our latest arrivals, festive collections, and everyday essentials to find pieces you love.</p>
          <Link to="/shop" className="primary-btn empty-wishlist-cta">
            <ShoppingBag size={18} aria-hidden="true" />
            <span>Discover Products</span>
          </Link>
        </div>
      ) : (
        <div className="products-grid">
          {wishlistItems.map((product) => {
            const pId = product.id || product._id;
            return (
              <div className="wishlist-product-card-wrap" key={pId}>
                <ProductCard product={product} />
                <button
                  type="button"
                  className="remove-wishlist-pill-btn"
                  onClick={() => removeFromWishlist(pId)}
                  aria-label={`Remove ${product.name} from wishlist`}
                >
                  Remove from Wishlist
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Explore Popular Collections & Benefits Section (Resolves thin content warning) */}
      <section className="wishlist-recommendations" aria-label="Explore Popular Collections">
        <div className="wishlist-recommendations-header">
          <h3>Explore Trending Collections</h3>
          <p>Looking for fashion inspiration? Check out our most sought-after categories.</p>
        </div>

        <div className="wishlist-categories-grid">
          <Link to="/shop" className="wishlist-cat-card">
            <div className="wishlist-cat-icon">
              <Layers size={22} aria-hidden="true" />
            </div>
            <h4>Kurtis & Sets</h4>
            <span>Daily & Festive</span>
          </Link>

          <Link to="/shop" className="wishlist-cat-card">
            <div className="wishlist-cat-icon">
              <Sparkles size={22} aria-hidden="true" />
            </div>
            <h4>Dresses</h4>
            <span>Flowy Silhouettes</span>
          </Link>

          <Link to="/shop" className="wishlist-cat-card">
            <div className="wishlist-cat-icon">
              <Shirt size={22} aria-hidden="true" />
            </div>
            <h4>Tops & Tunics</h4>
            <span>Casual & Office</span>
          </Link>

          <Link to="/shop" className="wishlist-cat-card">
            <div className="wishlist-cat-icon">
              <Package size={22} aria-hidden="true" />
            </div>
            <h4>Daily Basics</h4>
            <span>Essential Comfort</span>
          </Link>
        </div>

        <div className="wishlist-perks-banner">
          <div className="wishlist-perk-item">
            <Bell size={20} className="wishlist-perk-icon" aria-hidden="true" />
            <div className="wishlist-perk-text">
              <h5>Save for Later</h5>
              <p>Items saved in your wishlist remain saved on your device for seamless shopping.</p>
            </div>
          </div>
          <div className="wishlist-perk-item">
            <ShieldCheck size={20} className="wishlist-perk-icon" aria-hidden="true" />
            <div className="wishlist-perk-text">
              <h5>100% Quality Assurance</h5>
              <p>Every piece is verified for colorfast dyes, genuine fabrics, and tailored durability.</p>
            </div>
          </div>
          <div className="wishlist-perk-item">
            <Truck size={20} className="wishlist-perk-icon" aria-hidden="true" />
            <div className="wishlist-perk-text">
              <h5>Fast Pan-India Delivery</h5>
              <p>Quick doorstep delivery across all states with Cash on Delivery and online payment.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Wishlist;