import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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

    alert("Profile saved successfully");
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Save your delivery details for faster checkout</p>
      </div>

      <form className="profile-form" onSubmit={saveProfile}>
        <input
          name="name"
          placeholder="Full Name"
          value={profile.name}
          onChange={handleChange}
          required
        />

        <input
          name="mobile"
          placeholder="Mobile Number"
          value={profile.mobile}
          onChange={handleChange}
          required
        />

        <input
          name="email"
          placeholder="Email Address"
          value={profile.email}
          onChange={handleChange}
          required
        />

        <textarea
          name="address"
          placeholder="Full Address"
          value={profile.address}
          onChange={handleChange}
          required
        />

        <div className="form-grid">
          <input
            name="city"
            placeholder="City"
            value={profile.city}
            onChange={handleChange}
            required
          />

          <input
            name="state"
            placeholder="State"
            value={profile.state}
            onChange={handleChange}
            required
          />

          <input
            name="pincode"
            placeholder="Pincode"
            value={profile.pincode}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="primary-btn">
          Save Profile
        </button>
      </form>
    </div>
  );
}

export default Profile;