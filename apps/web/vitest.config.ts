import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: '../../packages/shared/src/utils/__tests__/setup.ts',
    // Tests live both in this app and in the shared package; include both so a
    // single `vitest run` from apps/web picks them all up.
    include: [
      'src/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      '../../packages/shared/src/**/*.{test,spec}.?(c|m)[jt]s?(x)',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*'
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
