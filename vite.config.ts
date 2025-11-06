import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// Helper function to normalize base path
const normalizeBasePath = (path: string): string => {
  if (!path || path === '/') return '/';
  
  // Ensure leading slash
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  
  // Ensure trailing slash
  if (!path.endsWith('/')) {
    path = path + '/';
  }
  
  return path;
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Check for environment variable override, fallback to mode-based value
  const envBasePath = process.env.VITE_BASE_PATH || process.env.BASE_PATH;
  const basePath = envBasePath 
    ? normalizeBasePath(envBasePath)
    : mode === 'production' ? '/partymate-inventory/' : '/';

  return {
    base: basePath,
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(), 
      mode === "development" && componentTagger(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
        manifest: {
          name: 'PartyMate Inventory',
          short_name: 'PartyMate',
          description: 'Auto parts inventory management system',
          theme_color: '#000000',
          background_color: '#ffffff',
          display: 'standalone',
          scope: basePath,
          start_url: basePath,
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/cdbasudljiqppmrqtsty\.supabase\.co\/.*$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 // 1 day
                }
              }
            }
          ]
        }
      })
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
