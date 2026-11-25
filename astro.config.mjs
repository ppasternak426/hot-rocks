// @ts-check
import { defineConfig } from "astro/config";

import sanity from "@sanity/astro";
import tailwindcss from "@tailwindcss/vite";

const redirects = {
  "/home": "/",
  "/booking-demo": "/book/",
  "/about-us": "/sessions/",
};

// https://astro.build/config
export default defineConfig({
  site: "https://thehotrockssauna.co.uk",
  redirects,
  build: {
    inlineStylesheets: "always",
  },
  integrations: [
    {
      name: "base-aware-redirects",
      hooks: {
        "astro:config:setup": ({ config, updateConfig }) => {
          const base = config.base.replace(/\/$/, "");
          if (!base) return;

          updateConfig({
            redirects: Object.fromEntries(
              Object.entries(redirects).map(([route, destination]) => [
                route,
                `${base}${destination}`,
              ]),
            ),
          });
        },
      },
    },
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
