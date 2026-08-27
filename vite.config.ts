import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from 'vite-plugin-pwa'
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      // Estrategia para que la PDA NUNCA quede pegada en un build viejo:
      // la navegación (index.html) se resuelve SIEMPRE desde la red (network-first),
      // de modo que tras un deploy la PDA carga el index.html nuevo aunque tuviera
      // un Service Worker cacheado con assets ya borrados. Los assets hasheados
      // (JS/CSS) siguen en cache-first porque son inmutables.
      workbox: {
        // Sin navigateFallback: la única ruta de navegación es la de abajo
        // (NetworkFirst), que siempre trae el index.html fresco del servidor.
        // Así, tras un deploy la PDA nunca queda con un index.html cacheado
        // que apunte a assets borrados. NetworkFirst cachea la respuesta,
        // así que mantiene fallback offline con el último index.html bueno.
        navigateFallback: null,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages',
              networkTimeoutSeconds: 5,
            },
          },
        ],
      },
      manifest: {
        name: 'SACTel Sistema de Tickets on Line',
        short_name: 'SACTel',
        description: 'SACTel Sistema de Tickets on Line - Plataforma integral para la gestión de tickets, control de rutas, administración de flota y validación de despachos en tiempo real.',
         lang: 'es',
         theme_color: '#ffffff',
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
      devOptions: {
        enabled: true // Permite probar la PWA incluso en modo desarrollo
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
