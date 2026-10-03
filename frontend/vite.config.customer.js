import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Dedicated Customer Portal Vite Build Config
// Outputs to dist so that Vercel, Netlify, and standard static web hosts immediately locate dist/index.html
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      input: {
        customer: path.resolve(__dirname, "index.html"),
      },
    },
  },
});
