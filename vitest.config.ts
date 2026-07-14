import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Unit tests run in a plain Node environment (domain logic, no DOM). The `@`
// alias mirrors tsconfig so tests import modules exactly as app code does.
// When component tests arrive we'll add jsdom + Testing Library.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
