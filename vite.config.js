import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// HOST -> SHOPIFY_APP_URL workaround (CLI)
if (
  process.env.HOST &&
  (!process.env.SHOPIFY_APP_URL ||
    process.env.SHOPIFY_APP_URL === process.env.HOST)
) {
  process.env.SHOPIFY_APP_URL = process.env.HOST;
  delete process.env.HOST;
}

const host = new URL(process.env.SHOPIFY_APP_URL || "http://localhost")
  .hostname;

let hmrConfig;
if (host === "localhost") {
  hmrConfig = {
    protocol: "ws",
    host: "localhost",
    port: 64999,
    clientPort: 64999,
  };
} else {
  hmrConfig = {
    protocol: "wss",
    host,
    port: parseInt(process.env.FRONTEND_PORT) || 8002,
    clientPort: 443,
  };
}

export default defineConfig({
  server: {
    allowedHosts: [host],
    cors: { preflightContinue: true },
    port: Number(process.env.PORT || 3000),
    hmr: hmrConfig,
    fs: { allow: ["app", "node_modules"] },
  },
  plugins: [reactRouter(), tsconfigPaths()],
  build: { assetsInlineLimit: 0 },

  // Pre-bundle and SSR settings to avoid named-export problems with CommonJS bundles
  optimizeDeps: {
    include: ["@shopify/app-bridge-react", "@shopify/polaris"],
  },

  ssr: {
    // Prevent treating @shopify/polaris as external during SSR so it will be compiled
    noExternal: ["@shopify/polaris"],
  },

  // Make process.env available at runtime in the client bundle (useful for small dev env)
  define: {
    "process.env": process.env,
  },
});
