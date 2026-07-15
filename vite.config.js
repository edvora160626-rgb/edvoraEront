import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: "es2020",
    cssCodeSplit: true,
    sourcemap: false,
    minify: "esbuild",
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react-dom") || id.includes("/react/")) {
            return "react-vendor";
          }
          if (id.includes("react-router")) return "router";
          if (id.includes("axios")) return "http";
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("react-select")) return "select";
          if (id.includes("@mui") || id.includes("@emotion")) return "mui";
          if (id.includes("date-fns")) return "dates";
        },
      },
    },
  },
  server: {
    // Keep HMR snappy; Lighthouse should use preview/build for scores
    warmup: {
      clientFiles: ["./src/main.jsx", "./src/App.jsx"],
    },
  },
});
