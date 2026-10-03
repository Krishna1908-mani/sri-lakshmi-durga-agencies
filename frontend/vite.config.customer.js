import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Dedicated Customer Portal Vite Build Config
// Produces physical bundle dist/customer with ZERO admin code or components
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist/customer",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        customer: path.resolve(__dirname, "index.html"),
      },
    },
  },
});
