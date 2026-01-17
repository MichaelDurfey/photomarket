import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRouter()],
  server: {
    port: 3001,
  },
  build: {
    outDir: "dist",
  },
  optimizeDeps: {
    include: [
      "@apollo/client",
      "cookie",
      "set-cookie-parser",
      "ts-invariant",
      "graphql-tag",
      "tslib",
      "@wry/equality",
      "optimism",
      "@wry/trie",
      "@wry/caches",
      "zen-observable-ts",
      "symbol-observable",
      "rehacktive",
      "rehackt",
    ],
  },
  ssr: {
    noExternal: ["react-router", "@apollo/client", "graphql"],
  },
});
