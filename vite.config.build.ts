import { defineConfig } from 'vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/main.ts',
      name: 'FluidMotion',
      fileName: (format) => `fluid-motion.${format}.js`
    },
    rollupOptions: {
      external: ['react'], // if needed
      output: {
        globals: {
          react: 'React' // if needed
        }
      }
    }
  },
  plugins: [cssInjectedByJsPlugin()]
});