import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Save, 
  Package, 
  Heart, 
  Compass, 
  LogOut,
  ShieldCheck
} from "lucide-react";

function Profile() {
  const navigate = useNavigate();

  const userToken = localStorage.getItem("userToken");
  const userName = localStorage.getItem("userName") || "";
  const userEmail = localStorage.getItem("userEmail") || "";

  const [profile, setProfile] = useState({
    name: userName,
    mobile: "",
    email: userEmail,
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!userToken) {
      navigate("/login");
      return;
    }

    const savedProfile =
      localStorage.getItem(`customerProfile_${userEmail}`) ||
      localStorage.getItem("customerProfile");

    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      setProfile(parsedProfile);
    }
  }, [userToken, userEmail, navigate]);

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
    if (isSaved) setIsSaved(false);
  };

  const saveProfile = (e) => {
    e.preventDefault();

    localStorage.setItem("customerProfile", JSON.stringify(profile));
    localStorage.setItem(
      `customerProfile_${profile.email}`,
      JSON.stringify(profile)
    );

    localStorage.setItem("userName", profile.name);
    localStorage.setItem("userEmail", profile.email);

    setIsSaved(true);
    alert("Profile saved successfully");
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    navigate("/");
  };

  const userInitial = (profile.name || userName || "U").charAt(0).toUpperCase();

  return (
    <div className="page profile-page">
      {/* Profile Header */}
      <div className="profile-header-banner">
        <div className="profile-avatar-box">
          <span>{userInitial}</span>
        </div>
        <div className="profile-header-info">
          <h1>{profile.name || "Customer Account"}</h1>
          <p className="profile-email-sub">{profile.email}</p>
          <div className="profile-status-pill">
            <ShieldCheck size={14} />
            <span>Verified Customer Account</span>
          </div>
        </div>

        <button type="button" onClick={handleLogout} className="profile-logout-btn">
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Quick Navigation Cards */}
      <div className="profile-quick-nav-grid">
        <Link to="/my-orders" className="profile-nav-card">
          <div className="nav-card-icon emerald">
            <Package size={22} />
          </div>
          <div>
            <h3>My Orders</h3>
            <p>View order history and track deliveries</p>
          </div>
        </Link>

        <Link to="/wishlist" className="profile-nav-card">
          <div className="nav-card-icon ruby">
            <Heart size={22} />
          </div>
          <div>
            <h3>Wishlist</h3>
            <p>Your saved favorites and styles</p>
          </div>
        </Link>

        <Link to="/track-order" className="profile-nav-card">
          <div className="nav-card-icon amber">
            <Compass size={22} />
          </div>
          <div>
            <h3>Track Order</h3>
            <p>Quick lookup with Order ID</p>
          </div>
        </Link>
      </div>

      {/* Delivery Address Form Card */}
      <div className="profile-form-container">
        <div className="profile-card-title-row">
          <MapPin size={22} className="card-title-icon" />
          <div>
            <h2>Default Shipping Address</h2>
            <p>Saved details automatically prefill during checkout</p>
          </div>
        </div>

        <form className="profile-form" onSubmit={saveProfile}>
          <div className="profile-form-grid">
            <div className="form-group">
              <label htmlFor="prof-name">Full Name *</label>
              <div className="input-with-icon">
                <User size={16} className="input-prefix-icon" />
                <input
                  id="prof-name"
                  name="name"
                  placeholder="Full Name"
                  value={profile.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="prof-mobile">Mobile Number *</label>
              <div className="input-with-icon">
                <Phone size={16} className="input-prefix-icon" />
                <input
                  id="prof-mobile"
                  name="mobile"
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={profile.mobile}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group span-2">
              <label htmlFor="prof-email">Email Address *</label>
              <div className="input-with-icon">
                <Mail size={16} className="input-prefix-icon" />
                <input
                  id="prof-email"
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  value={profile.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group span-2">
              <label htmlFor="prof-address">Street Address *</label>
              <textarea
                id="prof-address"
                name="address"
                placeholder="House / Flat no., Apartment, Street, Area"
                value={profile.address}
                onChange={handleChange}
                rows={3}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="prof-city">City / Town *</label>
              <input
                id="prof-city"
                name="city"
                placeholder="City"
                value={profile.city}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="prof-state">State *</label>
              <input
                id="prof-state"
                name="state"
                placeholder="State"
                value={profile.state}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group span-2">
              <label htmlFor="prof-pincode">Pincode *</label>
              <input
                id="prof-pincode"
                name="pincode"
                placeholder="6-digit Pincode"
                value={profile.pincode}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="profile-form-footer">
            <button type="submit" className="primary-btn save-profile-btn">
              <Save size={16} />
              <span>{isSaved ? "Saved Successfully!" : "Save Profile Details"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Profile;