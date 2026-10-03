import { useState, useEffect } from "react";
import CustomerApp from "./CustomerApp";
import AdminApp from "./AdminApp";

/**
 * ============================================================================
 * SRI LAKSHMI DURGA AGENCIES — HYBRID DEV / RUNTIME ENTRYPOINT
 * In production: Vite builds separate physical bundles (dist/customer & dist/admin)
 * In development: Seamlessly mounts AdminApp or CustomerApp based on subdomain/URL
 * ============================================================================
 */
function App() {
  const [isAdminPortal, setIsAdminPortal] = useState(() => {
    if (typeof window === "undefined") return false;
    const host = window.location.hostname.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    return host.startsWith("admin.") || pathname.startsWith("/admin");
  });

  useEffect(() => {
    const handlePopState = () => {
      const host = window.location.hostname.toLowerCase();
      const pathname = window.location.pathname.toLowerCase();
      setIsAdminPortal(host.startsWith("admin.") || pathname.startsWith("/admin"));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  if (isAdminPortal) {
    return <AdminApp />;
  }

  return <CustomerApp />;
}

export default App;