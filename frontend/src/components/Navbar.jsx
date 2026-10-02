import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Sparkles, 
  ShoppingBag, 
  Heart, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Search, 
  Package, 
  Compass, 
  Clock, 
  Sliders
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

function Navbar() {
  const { cartItems } = useCart();
  const { wishlistItems } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userToken = localStorage.getItem("userToken");
  const userName = localStorage.getItem("userName");

  const adminToken = localStorage.getItem("adminToken");
  const adminName = localStorage.getItem("adminName");

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const logoutUser = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    navigate("/");
  };

  const logoutAdmin = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminName");
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
              to="/track-order"
              className={location.pathname === "/track-order" ? "active-link" : ""}
            >
              <Compass size={15} />
              <span>Track Order</span>
            </Link>

            {userToken && (
              <>
                <Link
                  to="/my-orders"
                  className={location.pathname === "/my-orders" ? "active-link" : ""}
                >
                  <Package size={15} />
                  <span>Orders</span>
                </Link>
                <Link
                  to="/profile"
                  className={location.pathname === "/profile" ? "active-link" : ""}
                >
                  <User size={15} />
                  <span>Profile</span>
                </Link>
              </>
            )}

            {adminToken && (
              <Link
                to="/admin/dashboard"
                className={location.pathname.startsWith("/admin") ? "active-link admin-nav-link" : "admin-nav-link"}
              >
                <Sliders size={15} />
                <span>Admin</span>
              </Link>
            )}
          </nav>

          {/* Right Action Utilities */}
          <div className="nav-actions">
            {adminToken ? (
              <button className="login-btn btn-auth" onClick={logoutAdmin} title="Admin Sign Out">
                <LogOut size={15} />
                <span>{adminName || "Admin"}</span>
              </button>
            ) : userToken ? (
              <div className="user-action-group">
                <Link to="/profile" className="profile-pill" title="My Account">
                  <User size={15} />
                  <span>{userName ? userName.split(" ")[0] : "Account"}</span>
                </Link>
                <button className="btn-icon-logout" onClick={logoutUser} title="Sign Out">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="login-btn">
                <User size={15} />
                <span>Sign In</span>
              </Link>
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
              className={`hamburger-btn ${mobileMenuOpen ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
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
      <div className={`mobile-drawer ${mobileMenuOpen ? "open" : ""}`} aria-label="Mobile Navigation">
        <div className="mobile-drawer-header">
          <div className="drawer-brand">
            <img src="/logo.png" alt="Sri Lakshmi Durga Agencies" className="drawer-logo-img" />
            <span className="logo-text">Sri Lakshmi Durga</span>
          </div>
          <button
            className="mobile-drawer-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mobile-nav-links">
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>
            <Sparkles size={18} />
            <span>Home</span>
          </Link>
          <Link to="/shop" onClick={() => setMobileMenuOpen(false)}>
            <Search size={18} />
            <span>Shop Collection</span>
          </Link>
          <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)}>
            <Heart size={18} />
            <span>Wishlist ({wishlistItems.length})</span>
          </Link>
          <Link to="/recently-viewed" onClick={() => setMobileMenuOpen(false)}>
            <Clock size={18} />
            <span>Recently Viewed</span>
          </Link>
          <Link to="/track-order" onClick={() => setMobileMenuOpen(false)}>
            <Compass size={18} />
            <span>Track Order</span>
          </Link>

          {userToken && (
            <>
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

          {adminToken && (
            <Link
              to="/admin/dashboard"
              className="admin-link-highlight"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Sliders size={18} />
              <span>Admin Dashboard</span>
            </Link>
          )}
        </nav>

        <div className="mobile-drawer-footer">
          {adminToken ? (
            <button className="mobile-drawer-btn logout" onClick={logoutAdmin}>
              <LogOut size={16} />
              <span>Logout Admin</span>
            </button>
          ) : userToken ? (
            <button className="mobile-drawer-btn logout" onClick={logoutUser}>
              <LogOut size={16} />
              <span>Logout ({userName})</span>
            </button>
          ) : (
            <Link to="/login" className="mobile-drawer-btn login" onClick={() => setMobileMenuOpen(false)}>
              <User size={16} />
              <span>Sign In / Register</span>
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

export default Navbar;