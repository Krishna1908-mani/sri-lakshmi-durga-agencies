import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Sparkles, 
  ShoppingBag, 
  Heart, 
  User, 
  UserPlus,
  LogOut, 
  Menu, 
  X, 
  Search, 
  Package, 
  Compass, 
  Clock 
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import ThemeToggle from "./ThemeToggle";

function Navbar() {
  const { cartItems } = useCart();
  const { wishlistItems } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userToken = localStorage.getItem("userToken");
  const userName = localStorage.getItem("userName");

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle escape key to close menu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const logoutUser = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userId");
    setMobileMenuOpen(false);
    navigate("/");
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <>
      <header className="navbar">
        <div className="navbar-container">
          {/* Brand Logo */}
          <Link to="/" className="logo" aria-label="Sri Lakshmi Durga Agencies Home">
            <img src="/logo.png" alt="Sri Lakshmi Durga Agencies" className="logo-brand-img" />
            <div className="logo-text-block">
              <span className="logo-text">Sri Lakshmi Durga</span>
              <span className="logo-badge">Agencies</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="nav-links desktop-nav" aria-label="Main Navigation">
            <Link to="/" className={location.pathname === "/" ? "active-link" : ""}>
              Home
            </Link>
            <Link to="/shop" className={location.pathname === "/shop" ? "active-link" : ""}>
              Shop
            </Link>

            {userToken ? (
              <>
                <Link
                  to="/wishlist"
                  className={`wishlist-nav-link ${location.pathname === "/wishlist" ? "active-link" : ""}`}
                  aria-label={`Wishlist with ${wishlistItems.length} items`}
                >
                  <Heart size={16} className={`nav-icon-heart ${wishlistItems.length > 0 ? "has-items" : ""}`} />
                  <span>Wishlist</span>
                  {wishlistItems.length > 0 && <span className="nav-badge">{wishlistItems.length}</span>}
                </Link>
                <Link
                  to="/recently-viewed"
                  className={location.pathname === "/recently-viewed" ? "active-link" : ""}
                >
                  <Clock size={15} />
                  <span>Recent</span>
                </Link>
                <Link
                  to="/my-orders"
                  className={location.pathname === "/my-orders" ? "active-link" : ""}
                >
                  <Package size={15} />
                  <span>Orders</span>
                </Link>
                <Link
                  to="/track-order"
                  className={location.pathname === "/track-order" ? "active-link" : ""}
                >
                  <Compass size={15} />
                  <span>Track Order</span>
                </Link>
                <Link
                  to="/profile"
                  className={location.pathname === "/profile" ? "active-link" : ""}
                >
                  <User size={15} />
                  <span>Profile</span>
                </Link>
              </>
            ) : (
              <Link
                to="/track-order"
                className={location.pathname === "/track-order" ? "active-link" : ""}
              >
                <Compass size={15} />
                <span>Track Order</span>
              </Link>
            )}
          </nav>

          {/* Right Action Utilities */}
          <div className="nav-actions">
            {/* Theme Toggle Button */}
            <ThemeToggle className="desktop-theme-toggle" />

            {userToken ? (
              <div className="user-action-group">
                <Link to="/profile" className="profile-pill" title="Customer Account">
                  <User size={15} />
                  <span>{userName ? userName.split(" ")[0] : "Account"}</span>
                </Link>
                <button
                  type="button"
                  className="btn-icon-logout"
                  onClick={logoutUser}
                  title="Customer Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="auth-action-group">
                <Link to="/login" className="login-btn" title="Customer Sign In">
                  <User size={15} />
                  <span>Sign In</span>
                </Link>
                <Link to="/register" className="register-nav-btn" title="Create New Account">
                  <UserPlus size={15} />
                  <span>Create Account</span>
                </Link>
              </div>
            )}

            {/* Shopping Cart Button */}
            <Link to="/cart" className="cart-btn" aria-label={`Shopping cart with ${totalCartCount} items`}>
              <div className="cart-icon-wrapper">
                <ShoppingBag size={18} className="cart-icon" />
                {totalCartCount > 0 && (
                  <span className="cart-count-badge">{totalCartCount}</span>
                )}
              </div>
              <span className="cart-text">Cart</span>
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className={`hamburger-btn ${mobileMenuOpen ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="mobile-drawer-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Menu */}
      <div
        className={`mobile-drawer ${mobileMenuOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
      >
        <div className="mobile-drawer-header">
          <div className="drawer-brand">
            <img src="/logo.png" alt="Sri Lakshmi Durga Agencies" className="drawer-logo-img" />
            <span className="logo-text">Sri Lakshmi Durga</span>
          </div>
          <div className="drawer-header-actions">
            <ThemeToggle className="drawer-theme-toggle" />
            <button
              type="button"
              className="mobile-drawer-close"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation menu"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="mobile-nav-links" aria-label="Mobile Navigation Links">
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>
            <Sparkles size={18} />
            <span>Home</span>
          </Link>
          <Link to="/shop" onClick={() => setMobileMenuOpen(false)}>
            <Search size={18} />
            <span>Shop Collection</span>
          </Link>
          <Link to="/track-order" onClick={() => setMobileMenuOpen(false)}>
            <Compass size={18} />
            <span>Track Order</span>
          </Link>

          {userToken && (
            <>
              <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)}>
                <Heart size={18} />
                <span>Wishlist {wishlistItems.length > 0 ? `(${wishlistItems.length})` : ""}</span>
              </Link>
              <Link to="/recently-viewed" onClick={() => setMobileMenuOpen(false)}>
                <Clock size={18} />
                <span>Recently Viewed</span>
              </Link>
              <Link to="/my-orders" onClick={() => setMobileMenuOpen(false)}>
                <Package size={18} />
                <span>My Orders</span>
              </Link>
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                <User size={18} />
                <span>My Profile</span>
              </Link>
            </>
          )}
        </nav>

        <div className="mobile-drawer-footer">
          {userToken ? (
            <button type="button" className="mobile-drawer-btn logout" onClick={logoutUser}>
              <LogOut size={16} />
              <span>Sign Out ({userName ? userName.split(" ")[0] : "Customer"})</span>
            </button>
          ) : (
            <div className="mobile-drawer-auth-buttons">
              <Link to="/login" className="mobile-drawer-btn login" onClick={() => setMobileMenuOpen(false)}>
                <User size={16} />
                <span>Customer Sign In</span>
              </Link>
              <Link to="/register" className="mobile-drawer-btn register" onClick={() => setMobileMenuOpen(false)}>
                <UserPlus size={16} />
                <span>Create Account</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Navbar;