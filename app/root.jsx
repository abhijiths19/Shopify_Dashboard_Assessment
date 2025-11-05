// app/root.jsx
import React, { useEffect, useState } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import * as PolarisPkg from "@shopify/polaris";
const { AppProvider: PolarisProvider } = PolarisPkg;
import "@shopify/polaris/build/esm/styles.css";

/**
 * Client-only App Bridge wrapper
 * Avoids SSR crashes and ensures Provider only mounts in browser
 */
function ClientAppBridgeProvider({ config, children }) {
  const [ProviderComp, setProviderComp] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const mod = await import("@shopify/app-bridge-react");
        // detect both CJS and ESM export shapes
        const Provider =
          mod?.Provider || mod?.default?.Provider || mod?.default || null;

        if (mounted && Provider) {
          setProviderComp(() => Provider);
        } else {
          console.warn(
            "[AppBridgeProvider] Could not resolve Provider from @shopify/app-bridge-react",
            mod
          );
        }
      } catch (err) {
        console.warn("[AppBridgeProvider] Dynamic import failed", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (!ProviderComp) return <>{children}</>;
  const Provider = ProviderComp;
  return <Provider config={config}>{children}</Provider>;
}

function getHostFromUrl() {
  if (typeof window === "undefined") return null;
  try {
    const params = new URL(window.location.href).searchParams;
    return params.get("host") || window.location.hostname || null;
  } catch {
    return null;
  }
}

export default function App() {
  const host = typeof window !== "undefined" ? getHostFromUrl() : null;
  const apiKey = import.meta.env.VITE_SHOPIFY_API_KEY || process.env.SHOPIFY_API_KEY || "";

  const appBridgeConfig = {
    apiKey,
    host,
    forceRedirect: true,
  };

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <PolarisProvider i18n={{}}>
          <ClientAppBridgeProvider config={appBridgeConfig}>
            <Outlet />
          </ClientAppBridgeProvider>
        </PolarisProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
