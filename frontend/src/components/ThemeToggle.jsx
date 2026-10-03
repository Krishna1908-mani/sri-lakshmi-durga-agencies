import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

function ThemeToggle({ className = "", showLabel = false }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className={`theme-toggle-btn ${className}`}
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      <div className="theme-toggle-icon-wrap">
        {isDark ? (
          <Sun size={18} className="theme-icon sun" />
        ) : (
          <Moon size={18} className="theme-icon moon" />
        )}
      </div>
      {showLabel && (
        <span className="theme-toggle-label">
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
}

export default ThemeToggle;
