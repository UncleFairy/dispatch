import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Domain-logic tests run in a plain Node environment; component/hook tests
// opt into jsdom per-file via a `// @vitest-environment jsdom` docblock. The
// `@` alias mirrors tsconfig so tests import modules exactly as app code does.
export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'server-only': fileURLToPath(
        new URL('./vitest.server-only-stub.ts', import.meta.url),
      ),
    },
  },
});
