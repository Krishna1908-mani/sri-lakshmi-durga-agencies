import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Dedicated Administrator Portal Vite Build Config
// Produces physical bundle dist/admin strictly for management console
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist/admin",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        admin: path.resolve(__dirname, "admin.html"),
      },
    },
  },
});
