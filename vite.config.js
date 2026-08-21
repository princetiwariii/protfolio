import { defineConfig } from 'vite';

// Three.js is loaded via dynamic import() in main.js, so the bundler
// already splits it into its own async chunk — keeping the initial
// payload small without any manual chunk configuration.
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    cssMinify: true,
  },
});
