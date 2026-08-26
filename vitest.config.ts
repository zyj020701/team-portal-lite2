import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

/**
 * Root Vitest configuration for the Team Portal Lite monorepo.
 *
 * - jsdom environment for component/hook tests
 * - globals enabled so `describe`/`it`/`expect` are available without imports
 * - setupFiles registers @testing-library/jest-dom matchers
 * - v8 coverage provider with the project-wide 75% threshold
 *
 * Tests are collected from every package and the web app.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // pnpm does not hoist react to the workspace root, so resolve it
      // explicitly from the virtual store for all package/app tests.
      react: resolve(__dirname, 'node_modules/.pnpm/node_modules/react'),
      'react-dom': resolve(__dirname, 'node_modules/.pnpm/node_modules/react-dom'),
      '@team-portal/types': resolve(__dirname, 'packages/types/src/index.ts'),
      '@team-portal/utils': resolve(__dirname, 'packages/utils/src/index.ts'),
      '@team-portal/ui': resolve(__dirname, 'packages/ui/src/index.tsx'),
      '@team-portal/hooks': resolve(__dirname, 'packages/hooks/src/index.ts'),
      '@team-portal/ws-client': resolve(__dirname, 'packages/ws-client/src/index.ts'),
      '@team-portal/design-tokens': resolve(__dirname, 'packages/design-tokens/src/index.ts'),
      '@team-portal/icons': resolve(__dirname, 'packages/icons/src/index.tsx'),
      // Web-app internal `@/` alias (used by app-layer components).
      '@': resolve(__dirname, 'apps/web-app'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'packages/**/src/**/*.test.{ts,tsx}',
      'apps/**/src/**/*.test.{ts,tsx}',
      'apps/**/{components,hooks,lib,stores}/**/*.test.{ts,tsx}',
    ],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      // Include all files matching the `include` globs even when a specific
      // test run does not import them (ensures stable, comparable reports).
      all: true,
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      // Coverage is collected from all core modules: utils, hooks,
      // ws-client, stores, and web-app hooks/lib.
      include: [
        'packages/utils/src/**',
        'packages/hooks/src/**',
        'packages/ws-client/src/**',
        'packages/ui/src/hooks/**',
        'packages/ui/src/components/Button/**',
        'packages/ui/src/components/Input/**',
        'packages/ui/src/components/Modal/**',
        'apps/web-app/stores/**',
        'apps/web-app/hooks/**',
        'apps/web-app/lib/query-cache-utils.ts',
        'apps/web-app/lib/query-keys.ts',
      ],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/*.d.ts',
        '**/index.ts',
        '**/index.tsx',
        // Barrel re-export and type-only declaration files have no runtime
        // logic to cover; exclude explicitly so v8 `all: true` does not
        // pull them into the denominator.
        'packages/ws-client/src/index.ts',
        'packages/ws-client/src/types.ts',
        '**/node_modules/**',
        '**/dist/**',
        '**/.next/**',
        // Packages without runtime logic / covered by other means:
        'packages/icons/**',
        'packages/config-tailwind/**',
        'packages/config-store/**',
        'packages/types/**',
        'packages/i18n/**',
      ],
      thresholds: {
        // Project-wide floor (AGENTS.md §9.2).
        lines: 75,
        branches: 75,
        functions: 75,
        statements: 75,
        // Core modules target: ≥ 85%.
        'packages/utils/src/**': {
          lines: 85,
          branches: 85,
          functions: 85,
          statements: 85,
        },
        'packages/hooks/src/**': {
          lines: 85,
          branches: 85,
          functions: 85,
          statements: 85,
        },
        'packages/ws-client/src/**': {
          lines: 85,
          branches: 85,
          functions: 85,
          statements: 85,
        },
        'apps/web-app/stores/**': {
          lines: 85,
          branches: 85,
          functions: 85,
          statements: 85,
        },
        'apps/web-app/hooks/**': {
          lines: 85,
          branches: 85,
          functions: 85,
          statements: 85,
        },
      },
    },
  },
});
