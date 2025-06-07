import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig(({ command }) => {
  if (command === 'serve') {
    // dev server config
    return {
      root: path.resolve(__dirname, 'demo'),
      resolve: {
        alias: {
          '@lib': path.resolve(__dirname, 'src'),
        },
      },
      server: {
        port: 3000,
        open: true,
      },
    };
  } else {
    // build config for library
    return {
      build: {
        lib: {
          entry: path.resolve(__dirname, 'src/main.ts'),
          name: 'FluidMotionBlur',
          fileName: (format) => `fluid-motion-blur.${format}.js`,
          formats: ['es', 'umd'],
        },
        rollupOptions: {
          external: [],
          output: {
            globals: {},
          },
        },
        outDir: path.resolve(__dirname, 'dist'),
        sourcemap: true,
      },
      resolve: {
        alias: {
          '@lib': path.resolve(__dirname, 'src'),
        },
      },
    };
  }
});
