import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, "")}/v1/admin`
  : "http://localhost:5000/api/v1/admin";

const adminApi = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Send slda_admin_session host cookie
});

// Request interceptor: attach admin JWT
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthenticated and 403 forbidden
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      if (status === 401 || status === 403) {
        console.warn(`Admin API returned ${status}. Revoking local credentials.`);
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");

        const isAlreadyOnLogin = window.location.pathname.endsWith("/login");
        if (!isAlreadyOnLogin) {
          const loginPath = window.location.pathname.startsWith("/admin")
            ? "/admin/login"
            : "/login";
          window.location.href = `${loginPath}?reason=${status === 403 ? "access_denied" : "session_expired"}`;
        }
      }
    }
    return Promise.reject(error);
  }
);

export default adminApi;
