import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: env.VITE_BASE_PATH || '/',
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(env.GOOGLE_MAPS_PLATFORM_KEY || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api/nmc': {
          target: 'https://www.nmc.cn',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/nmc/, ''),
        },
        '/api/amap': {
          target: 'https://restapi.amap.com',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/amap/, ''),
        },
        '/api/amap-subway': {
          target: 'https://map.amap.com',
          changeOrigin: true,
          headers: {
            Referer: 'https://map.amap.com/subway/index.html',
            Origin: 'https://map.amap.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          },
          rewrite: (p) => p.replace(/^\/api\/amap-subway/, ''),
        },
        '/api/qweather': {
          target: 'https://api.qweather.com',
          changeOrigin: true,
          headers: {
            'Referer': 'https://dev.qweather.com/',
            'Origin': 'https://dev.qweather.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          },
          rewrite: (p) => p.replace(/^\/api\/qweather/, ''),
        },
      },
    },
  };
});
