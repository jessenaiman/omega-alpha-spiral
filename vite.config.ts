import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { host: '127.0.0.1', port: 5188, strictPort: true },
  preview: { host: '127.0.0.1', port: 4188, strictPort: true },
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        arcade: fileURLToPath(new URL('./spiral-breaker.html', import.meta.url)),
        basic: fileURLToPath(new URL('./basic.html', import.meta.url)),
        sceneTwo: fileURLToPath(new URL('./scene-two.html', import.meta.url)),
      },
    },
  },
});
