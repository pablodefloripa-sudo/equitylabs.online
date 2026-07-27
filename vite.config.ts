import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: process.env.GITHUB_ACTIONS ? "/EquityLabs20261/" : "/",
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("@supabase/supabase-js")) return "supabase";
          if (id.includes("framer-motion")) return "motion";
          if (id.includes("react-markdown") || id.includes("remark-gfm")) return "markdown";
          if (id.includes("@xiangfa/mindmap")) return "mindmap";
          if (id.includes("recharts")) return "charts";
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("@radix-ui")) return "radix";
          if (id.includes("@tanstack/react-query")) return "query";
          if (id.includes("react-router-dom")) return "router";
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
