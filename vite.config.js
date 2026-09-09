import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  esbuild: {
    logOverride: {
      "duplicate-object-key": "silent",
    },
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      input: {
        app: "index.html",
      },
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          icons: ["lucide-react"],
          charts: ["recharts"],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
  },
});
