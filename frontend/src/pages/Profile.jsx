import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  LogOut, 
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Plus,
  Trash2,
  Home,
  Check,
  X
} from "lucide-react";
import API from "../api/axios";

/**
 * ============================================================================
 * SRI LAKSHMI DURGA AGENCIES — CUSTOMER PROFILE PAGE
 * Reorganized into:
 *   1. Profile
 *   2. Personal Information
 *   3. Saved Addresses
 *   4. Communication Preferences
 *
 * All existing APIs, auth checks, database synchronizations, and session
 * behaviors are strictly preserved.
 * ============================================================================
 */

const EMPTY_ADDRESS_FORM = {
  title: "Home",
  name: "",
  mobile: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  isDefault: false,
};

function Profile() {
  const navigate = useNavigate();

  const userToken = localStorage.getItem("userToken");
  const userName = localStorage.getItem("userName") || "";
  const userEmail = localStorage.getItem("userEmail") || "";

  // 1. Profile State
  const [profile, setProfile] = useState({
    name: userName,
    mobile: "",
    email: userEmail,
    address: "",
    city: "",
    state: "",
    pincode: "",
    marketing_emails_enabled: true,
  });

  // 2. Personal Information Edit Mode State
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [personalForm, setPersonalForm] = useState({
    name: userName,
    mobile: "",
    email: userEmail,
  });

  // 3. Saved Addresses State
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressFormData, setAddressFormData] = useState(EMPTY_ADDRESS_FORM);

  // 4. Alert & Feedback States
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Helper to show transient success toast
  const showSuccessToast = (msg) => {
    setSuccessMsg(msg);
    setErrorMsg("");
    setTimeout(() => {
      setSuccessMsg("");
    }, 4000);
  };

  // Helper to sync default address into customerProfile for Checkout compatibility
  const syncDefaultAddressToProfile = useCallback((addressList, currentProfile) => {
    if (!userEmail) return;
    const defaultAddr = addressList.find((a) => a.isDefault) || addressList[0];
    if (defaultAddr) {
      const updated = {
        ...currentProfile,
        name: currentProfile.name || defaultAddr.name || userName,
        mobile: defaultAddr.mobile || currentProfile.mobile,
        address: defaultAddr.address,
        city: defaultAddr.city,
        state: defaultAddr.state,
        pincode: defaultAddr.pincode,
      };
      localStorage.setItem("customerProfile", JSON.stringify(updated));
      localStorage.setItem(`customerProfile_${userEmail}`, JSON.stringify(updated));
      setProfile((prev) => ({
        ...prev,
        mobile: defaultAddr.mobile || prev.mobile,
        address: defaultAddr.address,
        city: defaultAddr.city,
        state: defaultAddr.state,
        pincode: defaultAddr.pincode,
      }));
    }
  }, [userEmail, userName]);

  // Initial Load & Auth Check
  useEffect(() => {
    if (!userToken) {
      navigate("/login");
      return;
    }

    let parsedSavedProfile = null;
    const savedProfileStr =
      localStorage.getItem(`customerProfile_${userEmail}`) ||
      localStorage.getItem("customerProfile");

    if (savedProfileStr) {
      try {
        parsedSavedProfile = JSON.parse(savedProfileStr);
        setProfile((prev) => ({
          ...prev,
          ...parsedSavedProfile,
          name: parsedSavedProfile.name || userName,
          email: parsedSavedProfile.email || userEmail,
        }));
        setPersonalForm({
          name: parsedSavedProfile.name || userName,
          mobile: parsedSavedProfile.mobile || "",
          email: parsedSavedProfile.email || userEmail,
        });
      } catch (e) {
        console.warn("Failed to parse saved profile:", e);
      }
    }

    // Load Addresses from scoped local storage
    const savedAddressesKey = `customerAddresses_${userEmail}`;
    const storedAddressesStr = localStorage.getItem(savedAddressesKey);
    let loadedAddresses = [];

    if (storedAddressesStr) {
      try {
        const parsed = JSON.parse(storedAddressesStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedAddresses = parsed;
        }
      } catch (e) {
        console.warn("Failed to parse saved addresses:", e);
      }
    }

    // Migration / Seed: If no addresses array exists but customer had address in customerProfile
    if (loadedAddresses.length === 0 && parsedSavedProfile && parsedSavedProfile.address) {
      const initialDefault = {
        id: "addr_" + Date.now(),
        title: "Home",
        name: parsedSavedProfile.name || userName,
        mobile: parsedSavedProfile.mobile || "",
        address: parsedSavedProfile.address,
        city: parsedSavedProfile.city || "",
        state: parsedSavedProfile.state || "",
        pincode: parsedSavedProfile.pincode || "",
        isDefault: true,
      };
      loadedAddresses = [initialDefault];
      localStorage.setItem(savedAddressesKey, JSON.stringify(loadedAddresses));
    }

    setAddresses(loadedAddresses);

    // Fetch live customer session details from backend
    API.get("/auth/customer/me")
      .then((res) => {
        if (res.data?.user) {
          const liveName = res.data.user.name || userName;
          const liveEmail = res.data.user.email || userEmail;
          const liveMarketing = res.data.user.marketing_emails_enabled !== false;

          setProfile((prev) => ({
            ...prev,
            name: liveName,
            email: liveEmail,
            marketing_emails_enabled: liveMarketing,
          }));
          setPersonalForm((prev) => ({
            ...prev,
            name: liveName,
            email: liveEmail,
          }));
        }
      })
      .catch(() => {
        // Handled gracefully offline or on network jitter
      });
  }, [userToken, userEmail, userName, navigate]);

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userId");
    navigate("/");
  };

  // --------------------------------------------------------------------------
  // 1. PERSONAL INFORMATION HANDLERS
  // --------------------------------------------------------------------------
  const handlePersonalFormChange = (e) => {
    const { name, value } = e.target;
    setPersonalForm((prev) => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg("");
  };

  const startEditingPersonal = () => {
    setPersonalForm({
      name: profile.name || userName,
      mobile: profile.mobile || "",
      email: profile.email || userEmail,
    });
    setIsEditingPersonal(true);
    setErrorMsg("");
  };

  const cancelEditingPersonal = () => {
    setIsEditingPersonal(false);
    setErrorMsg("");
  };

  const handleSavePersonal = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSavingProfile(true);

    const trimmedName = (personalForm.name || "").trim();
    if (!trimmedName || !/^[A-Za-z ]+$/.test(trimmedName)) {
      setErrorMsg("Name can contain letters and spaces only.");
      setSavingProfile(false);
      return;
    }

    const trimmedEmail = (personalForm.email || "").trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setErrorMsg("Please enter a valid email address.");
      setSavingProfile(false);
      return;
    }

    const trimmedMobile = (personalForm.mobile || "").trim();
    if (trimmedMobile && !/^\d{10}$/.test(trimmedMobile.replace(/\D/g, ""))) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      setSavingProfile(false);
      return;
    }

    const updatedProfile = {
      ...profile,
      name: trimmedName,
      email: trimmedEmail,
      mobile: trimmedMobile,
    };

    setProfile(updatedProfile);
    localStorage.setItem("customerProfile", JSON.stringify(updatedProfile));
    localStorage.setItem(`customerProfile_${trimmedEmail}`, JSON.stringify(updatedProfile));
    localStorage.setItem("userName", trimmedName);
    localStorage.setItem("userEmail", trimmedEmail);

    try {
      await API.put("/auth/customer/profile", {
        name: trimmedName,
        marketing_emails_enabled: profile.marketing_emails_enabled,
      });
    } catch {
      // Backend sync error handled gracefully
    } finally {
      setSavingProfile(false);
    }

    setIsEditingPersonal(false);
    showSuccessToast("Personal information updated successfully!");
  };

  // --------------------------------------------------------------------------
  // 2. SAVED ADDRESSES CRUD HANDLERS
  // --------------------------------------------------------------------------
  const openAddAddressForm = () => {
    setEditingAddressId(null);
    setAddressFormData({
      ...EMPTY_ADDRESS_FORM,
      name: profile.name || userName,
      mobile: profile.mobile || "",
      isDefault: addresses.length === 0, // Auto-default if first address
    });
    setShowAddressForm(true);
    setErrorMsg("");
  };

  const openEditAddressForm = (addr) => {
    setEditingAddressId(addr.id);
    setAddressFormData({
      title: addr.title || "Home",
      name: addr.name || "",
      mobile: addr.mobile || "",
      address: addr.address || "",
      city: addr.city || "",
      state: addr.state || "",
      pincode: addr.pincode || "",
      isDefault: Boolean(addr.isDefault),
    });
    setShowAddressForm(true);
    setErrorMsg("");
  };

  const closeAddressForm = () => {
    setShowAddressForm(false);
    setEditingAddressId(null);
    setAddressFormData(EMPTY_ADDRESS_FORM);
    setErrorMsg("");
  };

  const handleAddressInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errorMsg) setErrorMsg("");
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    setErrorMsg("");

    const name = (addressFormData.name || "").trim();
    if (!name) {
      setErrorMsg("Please enter recipient's full name.");
      return;
    }

    const cleanMobile = (addressFormData.mobile || "").replace(/\D/g, "");
    if (!cleanMobile || cleanMobile.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }

    const street = (addressFormData.address || "").trim();
    if (!street || street.length < 5) {
      setErrorMsg("Please enter a complete street address.");
      return;
    }

    const city = (addressFormData.city || "").trim();
    if (!city) {
      setErrorMsg("City / Town is required.");
      return;
    }

    const state = (addressFormData.state || "").trim();
    if (!state) {
      setErrorMsg("State is required.");
      return;
    }

    const pincode = (addressFormData.pincode || "").replace(/\D/g, "");
    if (!pincode || pincode.length !== 6) {
      setErrorMsg("Please enter a valid 6-digit PIN code.");
      return;
    }

    const title = (addressFormData.title || "Home").trim();
    const shouldBeDefault = addressFormData.isDefault || addresses.length === 0;

    let updatedList;

    if (editingAddressId) {
      // Edit existing address
      updatedList = addresses.map((addr) => {
        if (addr.id === editingAddressId) {
          return {
            ...addr,
            title,
            name,
            mobile: cleanMobile,
            address: street,
            city,
            state,
            pincode,
            isDefault: shouldBeDefault,
          };
        }
        return shouldBeDefault ? { ...addr, isDefault: false } : addr;
      });
      showSuccessToast("Address updated successfully!");
    } else {
      // Add new address
      const newAddress = {
        id: "addr_" + Date.now(),
        title,
        name,
        mobile: cleanMobile,
        address: street,
        city,
        state,
        pincode,
        isDefault: shouldBeDefault,
      };

      if (shouldBeDefault) {
        updatedList = [...addresses.map((a) => ({ ...a, isDefault: false })), newAddress];
      } else {
        updatedList = [...addresses, newAddress];
      }
      showSuccessToast("New address added successfully!");
    }

    setAddresses(updatedList);
    localStorage.setItem(`customerAddresses_${userEmail}`, JSON.stringify(updatedList));
    syncDefaultAddressToProfile(updatedList, profile);
    closeAddressForm();
  };

  const handleDeleteAddress = (id) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;

    const targetAddr = addresses.find((a) => a.id === id);
    let remaining = addresses.filter((a) => a.id !== id);

    // If we deleted the default address, make the first remaining address the default
    if (targetAddr?.isDefault && remaining.length > 0) {
      remaining = remaining.map((addr, idx) => ({
        ...addr,
        isDefault: idx === 0,
      }));
    }

    setAddresses(remaining);
    localStorage.setItem(`customerAddresses_${userEmail}`, JSON.stringify(remaining));
    syncDefaultAddressToProfile(remaining, profile);
    showSuccessToast("Address removed successfully!");
  };

  const handleSetDefaultAddress = (id) => {
    const updatedList = addresses.map((addr) => ({
      ...addr,
      isDefault: addr.id === id,
    }));

    setAddresses(updatedList);
    localStorage.setItem(`customerAddresses_${userEmail}`, JSON.stringify(updatedList));
    syncDefaultAddressToProfile(updatedList, profile);
    showSuccessToast("Default delivery address updated!");
  };

  // --------------------------------------------------------------------------
  // 3. COMMUNICATION PREFERENCES HANDLER
  // --------------------------------------------------------------------------
  const handleTogglePromotionalEmails = async () => {
    const nextState = !profile.marketing_emails_enabled;

    setProfile((prev) => ({
      ...prev,
      marketing_emails_enabled: nextState,
    }));

    const updatedProfile = {
      ...profile,
      marketing_emails_enabled: nextState,
    };

    localStorage.setItem("customerProfile", JSON.stringify(updatedProfile));
    localStorage.setItem(`customerProfile_${userEmail}`, JSON.stringify(updatedProfile));

    try {
      await API.put("/auth/customer/profile", {
        name: profile.name,
        marketing_emails_enabled: nextState,
      });
    } catch {
      // Backend synchronization error handled gracefully
    }

    showSuccessToast(
      nextState
        ? "Promotional email notifications enabled."
        : "Promotional email notifications paused."
    );
  };

  const userInitial = (profile.name || userName || "U").charAt(0).toUpperCase();

  return (
    <div className="page profile-page">
      <div className="profile-page-content">

        {/* ==================================================================
            1. PROFILE (HEADER & ACCOUNT SUMMARY)
            ================================================================== */}
        <section className="profile-header-section" aria-label="Customer Profile Header">
          <div className="profile-header-left">
            <div className="profile-avatar-box" aria-hidden="true">
              <span>{userInitial}</span>
            </div>
            <div className="profile-header-info">
              <h1 className="profile-main-title">Profile</h1>
              <p className="profile-user-email">{profile.email || "customer@slda.com"}</p>
              <div className="profile-status-pill">
                <ShieldCheck size={14} />
                <span>Verified Customer Account</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="profile-logout-btn"
            aria-label="Sign Out of Customer Account"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </section>

        {/* Global Feedback Notifications */}
        {errorMsg && (
          <div className="auth-alert-box" role="alert">
            <AlertCircle size={18} className="alert-icon" />
            <div className="alert-content">
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="auth-alert-box success" role="alert">
            <CheckCircle2 size={18} className="alert-icon" />
            <div className="alert-content">
              <span>{successMsg}</span>
            </div>
          </div>
        )}

        {/* ==================================================================
            2. PERSONAL INFORMATION
            ================================================================== */}
        <section className="profile-section-card" aria-labelledby="personal-info-heading">
          <div className="profile-section-header">
            <div className="profile-section-header-left">
              <div className="profile-section-icon" aria-hidden="true">
                <User size={20} />
              </div>
              <div>
                <h2 id="personal-info-heading" className="profile-section-title">
                  Personal Information
                </h2>
                <p className="profile-section-desc">
                  Your identity details associated with this store account
                </p>
              </div>
            </div>

            {!isEditingPersonal && (
              <button
                type="button"
                onClick={startEditingPersonal}
                className="profile-btn-outline"
                id="edit-profile-btn"
                aria-label="Edit Profile Details"
              >
                <Edit3 size={15} />
                <span>Edit Profile</span>
              </button>
            )}
          </div>

          {/* Display Mode */}
          {!isEditingPersonal ? (
            <div className="profile-info-grid">
              <div className="profile-info-item">
                <span className="profile-info-label">
                  <User size={13} />
                  <span>Full Name</span>
                </span>
                <span className="profile-info-value">{profile.name || "Not provided"}</span>
              </div>

              <div className="profile-info-item">
                <span className="profile-info-label">
                  <Mail size={13} />
                  <span>Email</span>
                </span>
                <span className="profile-info-value">{profile.email || "Not provided"}</span>
              </div>

              <div className="profile-info-item">
                <span className="profile-info-label">
                  <Phone size={13} />
                  <span>Mobile Number</span>
                </span>
                <span className="profile-info-value">{profile.mobile || "Not provided"}</span>
              </div>
            </div>
          ) : (
            /* Edit Mode Form */
            <form onSubmit={handleSavePersonal} noValidate>
              <div className="profile-form-grid">
                <div className="profile-field-group">
                  <label htmlFor="edit-name">
                    Full Name <span className="required-star">*</span>
                  </label>
                  <div className="profile-input-with-icon">
                    <User size={16} className="input-prefix-icon" aria-hidden="true" />
                    <input
                      id="edit-name"
                      name="name"
                      type="text"
                      placeholder="Full Name"
                      value={personalForm.name}
                      onChange={handlePersonalFormChange}
                      required
                    />
                  </div>
                </div>

                <div className="profile-field-group">
                  <label htmlFor="edit-mobile">Mobile Number</label>
                  <div className="profile-input-with-icon">
                    <Phone size={16} className="input-prefix-icon" aria-hidden="true" />
                    <input
                      id="edit-mobile"
                      name="mobile"
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={personalForm.mobile}
                      onChange={handlePersonalFormChange}
                    />
                  </div>
                </div>

                <div className="profile-field-group span-2">
                  <label htmlFor="edit-email">
                    Email <span className="required-star">*</span>
                  </label>
                  <div className="profile-input-with-icon">
                    <Mail size={16} className="input-prefix-icon" aria-hidden="true" />
                    <input
                      id="edit-email"
                      name="email"
                      type="email"
                      placeholder="Email Address"
                      value={personalForm.email}
                      onChange={handlePersonalFormChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="profile-actions-row">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="profile-btn-primary"
                  id="save-personal-btn"
                >
                  <Check size={16} />
                  <span>{savingProfile ? "Saving..." : "Save Changes"}</span>
                </button>
                <button
                  type="button"
                  onClick={cancelEditingPersonal}
                  className="profile-btn-secondary"
                  id="cancel-personal-btn"
                >
                  <X size={16} />
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          )}
        </section>

        {/* ==================================================================
            3. SAVED ADDRESSES
            ================================================================== */}
        <section className="profile-section-card" aria-labelledby="saved-addresses-heading">
          <div className="profile-section-header">
            <div className="profile-section-header-left">
              <div className="profile-section-icon" aria-hidden="true">
                <MapPin size={20} />
              </div>
              <div>
                <h2 id="saved-addresses-heading" className="profile-section-title">
                  Saved Addresses
                </h2>
                <p className="profile-section-desc">
                  Manage your delivery destinations for fast and seamless checkout
                </p>
              </div>
            </div>

            {!showAddressForm && (
              <button
                type="button"
                onClick={openAddAddressForm}
                className="profile-btn-primary"
                id="add-address-top-btn"
                aria-label="Add New Address"
              >
                <Plus size={16} />
                <span>Add New Address</span>
              </button>
            )}
          </div>

          {/* Add / Edit Address Form */}
          {showAddressForm && (
            <div className="address-form-box" role="region" aria-label="Address Form">
              <h3 className="address-form-title">
                <MapPin size={18} />
                <span>{editingAddressId ? "Edit Delivery Address" : "Add New Delivery Address"}</span>
              </h3>

              <form onSubmit={handleSaveAddress} noValidate>
                <div className="profile-form-grid">
                  <div className="profile-field-group">
                    <label htmlFor="addr-title">Address Label / Title</label>
                    <select
                      id="addr-title"
                      name="title"
                      value={addressFormData.title}
                      onChange={handleAddressInputChange}
                      className="profile-select"
                    >
                      <option value="Home">Home</option>
                      <option value="Office">Office</option>
                      <option value="Work">Work</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="profile-field-group">
                    <label htmlFor="addr-name">
                      Recipient Full Name <span className="required-star">*</span>
                    </label>
                    <input
                      id="addr-name"
                      name="name"
                      type="text"
                      placeholder="Full Name"
                      value={addressFormData.name}
                      onChange={handleAddressInputChange}
                      className="profile-input"
                      required
                    />
                  </div>

                  <div className="profile-field-group">
                    <label htmlFor="addr-mobile">
                      Mobile Number <span className="required-star">*</span>
                    </label>
                    <input
                      id="addr-mobile"
                      name="mobile"
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={addressFormData.mobile}
                      onChange={handleAddressInputChange}
                      className="profile-input"
                      required
                    />
                  </div>

                  <div className="profile-field-group">
                    <label htmlFor="addr-city">
                      City / Town <span className="required-star">*</span>
                    </label>
                    <input
                      id="addr-city"
                      name="city"
                      type="text"
                      placeholder="City or Town"
                      value={addressFormData.city}
                      onChange={handleAddressInputChange}
                      className="profile-input"
                      required
                    />
                  </div>

                  {/* Street Address textarea: min-height 110px, resizable, comfortably supports 2-4 lines, no blank space */}
                  <div className="profile-field-group span-2">
                    <label htmlFor="addr-street">
                      Street Address <span className="required-star">*</span>
                    </label>
                    <textarea
                      id="addr-street"
                      name="address"
                      placeholder="Flat / Door no., Apartment / Building name, Street, Area"
                      value={addressFormData.address}
                      onChange={handleAddressInputChange}
                      className="profile-textarea"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="profile-field-group">
                    <label htmlFor="addr-state">
                      State <span className="required-star">*</span>
                    </label>
                    <input
                      id="addr-state"
                      name="state"
                      type="text"
                      placeholder="State"
                      value={addressFormData.state}
                      onChange={handleAddressInputChange}
                      className="profile-input"
                      required
                    />
                  </div>

                  <div className="profile-field-group">
                    <label htmlFor="addr-pincode">
                      PIN Code <span className="required-star">*</span>
                    </label>
                    <input
                      id="addr-pincode"
                      name="pincode"
                      type="text"
                      placeholder="6-digit PIN code"
                      maxLength={6}
                      value={addressFormData.pincode}
                      onChange={handleAddressInputChange}
                      className="profile-input"
                      required
                    />
                  </div>

                  <div className="profile-field-group span-2">
                    <label className="profile-checkbox-label" htmlFor="addr-is-default">
                      <input
                        id="addr-is-default"
                        name="isDefault"
                        type="checkbox"
                        checked={addressFormData.isDefault}
                        onChange={handleAddressInputChange}
                      />
                      <span>Set as default delivery address</span>
                    </label>
                  </div>
                </div>

                <div className="profile-actions-row">
                  <button type="submit" className="profile-btn-primary" id="save-address-submit-btn">
                    <Check size={16} />
                    <span>{editingAddressId ? "Update Address" : "Save Address"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={closeAddressForm}
                    className="profile-btn-secondary"
                    id="cancel-address-btn"
                  >
                    <X size={16} />
                    <span>Cancel</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Address Cards List */}
          {addresses.length === 0 && !showAddressForm ? (
            <div className="profile-empty-addresses">
              <MapPin size={36} style={{ color: "var(--neutral-400)", margin: "0 auto 12px auto" }} />
              <h4>No Saved Addresses Found</h4>
              <p>Add a delivery address to enable 1-click checkout on your next order.</p>
              <button
                type="button"
                onClick={openAddAddressForm}
                className="profile-btn-primary"
                style={{ marginTop: 12 }}
              >
                <Plus size={16} />
                <span>Add New Address</span>
              </button>
            </div>
          ) : (
            <div className="profile-address-grid">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`profile-address-card ${addr.isDefault ? "is-default" : ""}`}
                >
                  <div className="address-card-header">
                    <span className="address-title-pill">
                      <Home size={12} />
                      <span>{addr.title || "Address"}</span>
                    </span>

                    {addr.isDefault && (
                      <span className="address-default-badge">
                        <Check size={12} />
                        <span>Default Address</span>
                      </span>
                    )}
                  </div>

                  <div className="address-card-body">
                    <h4 className="address-card-name">{addr.name}</h4>
                    <p className="address-card-text">{addr.address}</p>
                    <p className="address-card-text">
                      {addr.city}, {addr.state} - {addr.pincode}
                    </p>
                    <span className="address-card-phone">
                      <Phone size={13} />
                      <span>+91 {addr.mobile}</span>
                    </span>
                  </div>

                  <div className="address-card-actions">
                    <button
                      type="button"
                      onClick={() => openEditAddressForm(addr)}
                      className="address-action-btn"
                      aria-label={`Edit ${addr.title} address`}
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="address-action-btn delete"
                      aria-label={`Delete ${addr.title} address`}
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>

                    {!addr.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultAddress(addr.id)}
                        className="address-action-btn default"
                        aria-label={`Set ${addr.title} as default address`}
                      >
                        <Check size={13} />
                        <span>Set as Default</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add New Address action button below address cards */}
          {!showAddressForm && addresses.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <button
                type="button"
                onClick={openAddAddressForm}
                className="profile-btn-outline"
                id="add-new-address-btn"
              >
                <Plus size={16} />
                <span>Add New Address</span>
              </button>
            </div>
          )}
        </section>

        {/* ==================================================================
            4. COMMUNICATION PREFERENCES
            ================================================================== */}
        <section className="profile-section-card" aria-labelledby="comm-preferences-heading">
          <div className="profile-section-header">
            <div className="profile-section-header-left">
              <div className="profile-section-icon" aria-hidden="true">
                <Mail size={20} />
              </div>
              <div>
                <h2 id="comm-preferences-heading" className="profile-section-title">
                  Communication Preferences
                </h2>
                <p className="profile-section-desc">
                  Customize how Sri Lakshmi Durga Agencies contacts you
                </p>
              </div>
            </div>
          </div>

          <div className="comm-pref-card">
            <div className="comm-pref-text">
              <h4>Promotional Emails</h4>
              <p>Receive promotional emails about offers, products, and updates.</p>
            </div>

            <button
              type="button"
              role="switch"
              id="promotional-emails-toggle"
              aria-checked={profile.marketing_emails_enabled}
              aria-label="Toggle promotional emails"
              className={`profile-toggle-switch ${profile.marketing_emails_enabled ? "is-on" : ""}`}
              onClick={handleTogglePromotionalEmails}
            >
              <span className="toggle-switch-thumb" aria-hidden="true" />
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}

export default Profile;