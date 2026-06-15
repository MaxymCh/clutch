import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  server: {
    // Dev : /api est proxifié vers l'API interne (docker, port 8000).
    // Même origine côté navigateur → cookie de session envoyé sans config
    // CORS particulière. En prod, définir VITE_API_URL.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Clutch — Calendrier EWC 2026',
        short_name: 'Clutch',
        description:
          "Tous les matchs de l'Esports World Cup 2026 en un calendrier unifié, filtrable par jeu et par équipe.",
        lang: 'fr',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#e2260a',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
    }),
  ],
});
