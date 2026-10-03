import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  PlusCircle, 
  ShoppingBag, 
  Tag, 
  BarChart3, 
  Image as ImageIcon, 
  Settings, 
  ExternalLink, 
  LogOut
} from "lucide-react";

function AdminNavbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminName");
    navigate("/admin/login");
  };

  const navItems = [
    { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Products", path: "/admin/products", icon: Package },
    { label: "Add Product", path: "/admin/add-product", icon: PlusCircle },
    { label: "Orders", path: "/admin/orders", icon: ShoppingBag },
    { label: "Coupons", path: "/admin/coupons", icon: Tag },
    { label: "Reports", path: "/admin/reports", icon: BarChart3 },
    { label: "Banner", path: "/admin/banner", icon: ImageIcon },
    { label: "Settings", path: "/admin/settings", icon: Settings },
  ];

  return (
    <header className="admin-nav-bar">
      <div className="admin-nav-container">
        <div className="admin-nav-brand-group">
          <Link to="/admin/dashboard" className="admin-logo">
            <img src="/logo.png" alt="Sri Lakshmi Durga Agencies" className="admin-logo-img" />
            <div className="admin-logo-text">
              <span className="logo-main">Sri Lakshmi Durga</span>
              <span className="admin-pill-tag">PORTAL</span>
            </div>
          </Link>
        </div>

        <nav className="admin-nav-links" aria-label="Admin Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`admin-nav-tab ${isActive ? "active" : ""}`}
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="admin-nav-actions">
          <Link to="/shop" className="view-store-pill" target="_blank" rel="noopener noreferrer" title="Preview public shop">
            <span>View Store</span>
            <ExternalLink size={13} />
          </Link>

          <button onClick={logout} className="admin-logout-pill" title="Sign out of Admin">
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default AdminNavbar;
