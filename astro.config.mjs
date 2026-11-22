// @ts-check
import { defineConfig } from "astro/config";

import sanity from "@sanity/astro";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://thehotrockssauna.co.uk",
  redirects: {
    "/home": "/",
    "/booking-demo": "/book/",
    "/about-us": "/sessions/",
  },
  integrations: [
    sanity({
      projectId: "mdwbejwr",
      dataset: "production",
      apiVersion: "2026-03-01",
      useCdn: false,
      injectTypes: true,
    }),
  ],
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
