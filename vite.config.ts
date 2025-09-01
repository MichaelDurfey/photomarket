import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { reactRouter } from "@react-router/dev/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), reactRouter()],
  server: {
    port: 3001,
  },
  build: {
    outDir: "dist",
  },
  ssr: {
    noExternal: ["react-router", "@apollo/client", "graphql"],
  },
});
