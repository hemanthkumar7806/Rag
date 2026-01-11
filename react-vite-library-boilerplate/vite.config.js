import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { resolve } from "node:path";
import { name } from "./package.json";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), dts()],
  css: {
    // Extract CSS into separate file for better caching
    extract: true,
  },
  build: {
    lib: {
      entry: resolve("src", "index.ts"),
      name,
      formats: ["es", "umd"],
      fileName: (format) => `${name}.${format}.js`,
    },
    // Ensure CSS is included in the build
    cssCodeSplit: false,

    rollupOptions: {
      // Only externalize React and ReactDOM to avoid duplicate React instances
      // All other dependencies will be bundled
      external: [
        "react",
        "react/jsx-runtime",
        "react-dom",
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "react/jsx-runtime",
        },
      },
    },
  },
});
