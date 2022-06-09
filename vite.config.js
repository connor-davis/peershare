import { defineConfig } from 'vite';
import { resolve } from 'path';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  base: "./",
  resolve: {
    alias: {
      '@src': resolve(__dirname, 'src'),
    },
  },
  plugins: [solidPlugin()],
  build: {
    target: 'esnext',
    polyfillDynamicImport: false,
  },
});
