import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, "")}/v1/customer`
  : "http://localhost:5000/api/v1/customer";

const customerApi = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Send slda_customer_session cookie
});

// Request interceptor: attach customer JWT if present
customerApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("userToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 session expiration
customerApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear customer session
      localStorage.removeItem("userToken");
      localStorage.removeItem("user");
      // If on a page requiring customer auth, redirect
      if (
        window.location.pathname === "/my-orders" ||
        window.location.pathname === "/profile"
      ) {
        window.location.href = "/login?reason=expired";
      }
    }
    return Promise.reject(error);
  }
);

export default customerApi;
