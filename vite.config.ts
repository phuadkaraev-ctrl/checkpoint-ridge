import {defineConfig} from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    sourcemap: true,
    emptyOutDir: true,
  },
  test: {
    environment: 'node',
  },
});
