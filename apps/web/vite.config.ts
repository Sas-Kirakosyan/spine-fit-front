import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      // Static assets that should be precached but live outside the build graph
      includeAssets: ["favicon.ico", "logo/apple-touch-icon-180x180.png"],
      manifest: {
        id: "/",
        name: "SpineFit — Safe Gym Training",
        short_name: "SpineFit",
        description:
          "AI coach for back-safe strength training. Personalized plans for sciatica and L5–S1 protection.",
        lang: "en",
        theme_color: "#080A14",
        background_color: "#080A14",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/logo/pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "/logo/pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/logo/pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/logo/maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Precache only the app shell — NOT the ~200 exercise/quiz images.
        globPatterns: ["**/*.{js,css,html}", "logo/*.png", "favicon.ico"],
        globIgnores: ["**/exercisesSm/**", "**/exercises/**", "**/quiz/**"],
        navigateFallback: "index.html",
        navigateFallbackDenylist: [
          /^\/about/,
          /^\/exercises-herniated-disc/,
          /^\/sciatica-gym-guide/,
          /^\/l5-s1-workout-plan/,
        ],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            // Exercise / quiz images: lazily cached on first view, kept offline.
            urlPattern: ({ url }) =>
              url.pathname.startsWith("/exercisesSm/") ||
              url.pathname.startsWith("/exercises/") ||
              url.pathname.startsWith("/quiz/"),
            handler: "CacheFirst",
            options: {
              cacheName: "spinefit-images",
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24 * 60, // 60 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
        // Supabase auth and Gemini AI calls are cross-origin and intentionally
        // left untouched (no runtime cache rule) → always go to network.
      },
    }),
  ],
  publicDir: path.resolve(__dirname, "../../packages/shared/public"),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    dedupe: ["react", "react-dom"],
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        about: path.resolve(__dirname, "about.html"),
        exercisesHerniatedDisc: path.resolve(__dirname, "exercises-herniated-disc.html"),
        sciaticaGymGuide: path.resolve(__dirname, "sciatica-gym-guide.html"),
        l5s1WorkoutPlan: path.resolve(__dirname, "l5-s1-workout-plan.html"),
      },
    },
  },
});