// @ts-check
import { fileURLToPath } from 'node:url';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';

// Resolve the directory of this config file so that the TypeScript project
// service can locate tsconfig files regardless of the CWD from which ESLint
// is invoked (turborepo runs each lint task from its own package directory on
// Linux CI, which caused "projectService" to fail without an explicit root).
const tsconfigRootDir = fileURLToPath(new URL('.', import.meta.url));

/**
 * Shared ESLint flat config for the Team Portal Lite monorepo.
 *
 * Key rules enforced here:
 *  - @typescript-eslint/no-explicit-any      → error (spec 6.6 / R2)
 *  - @typescript-eslint/no-unsafe-assignment → error (R2)
 *  - @typescript-eslint/no-unsafe-call       → error (R2)
 *  - @typescript-eslint/no-unsafe-member-access → error (R2)
 *  - @typescript-eslint/consistent-type-imports → warn (R2/3.1)
 *  - no-restricted-syntax                    → bans hardcoded hex / rgb()
 *    colour literals in TS/TSX source so that every colour must come
 *    from a Design Token (spec 6.2).
 *
 * Type-aware rules (no-unsafe-*) require parserOptions.projectService so
 * that ESLint can load the TypeScript program and resolve real types.
 *
 * The design-tokens package itself is allowed to contain raw colour
 * values because that is where tokens are defined.
 */

export default [
  {
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/node_modules/**',
      '**/build/**',
      '**/coverage/**',
      '**/.lighthouse/**',
      '**/*.config.{js,mjs,cjs,ts,mts,cts}',
      '**/*.setup.ts',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        // Enable type-aware linting so no-unsafe-* rules can resolve types.
        // projectService auto-discovers the nearest tsconfig for each file,
        // which is required in a pnpm + Turborepo monorepo where every app
        // and package has its own tsconfig.json.
        projectService: true,
        // Anchor tsconfig resolution to this config file's directory so it
        // works regardless of the CWD (turborepo invokes ESLint from each
        // package directory on Linux CI).
        tsconfigRootDir,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      import: importPlugin,
    },
    rules: {
      // ── Strict TypeScript ──────────────────────────────────
      '@typescript-eslint/no-explicit-any': 'error',
      // Type-aware: forbid unsafely assigning/calling/accessing values
      // that resolve to `any`. This catches the "any 兜底" anti-pattern
      // described in the spec (R2).
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          disallowTypeAnnotations: true,
          fixStyle: 'separate-type-imports',
        },
      ],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // ── Cross-layer import restrictions ────────────────────
      // Enforce strict layering: common → ui → apps (one direction only).
      // Uses both import/no-restricted-paths (for relative paths) and
      // no-restricted-imports (for package-name imports).
      'import/no-restricted-paths': [
        'error',
        {
          // Anchor zone globs to the repo root so they resolve correctly
          // regardless of the directory turbo invokes ESLint from on CI.
          basePath: tsconfigRootDir,
          zones: [
            {
              target: './packages/ui/**',
              from: './apps/**',
              message: 'packages/ui must not import from apps/. Layer violation.',
            },
            {
              target: './packages/utils/**',
              from: './packages/ui/**',
              message: 'packages/utils must not import from packages/ui. Layer violation.',
            },
            {
              target: './packages/utils/**',
              from: './apps/**',
              message: 'packages/utils must not import from apps/. Layer violation.',
            },
            {
              target: './packages/types/**',
              from: './packages/ui/**',
              message: 'packages/types must not import from packages/ui. Layer violation.',
            },
            {
              target: './packages/types/**',
              from: './apps/**',
              message: 'packages/types must not import from apps/. Layer violation.',
            },
            {
              target: './packages/design-tokens/**',
              from: './packages/ui/**',
              message: 'packages/design-tokens must not import from packages/ui. Layer violation.',
            },
            {
              target: './packages/design-tokens/**',
              from: './apps/**',
              message: 'packages/design-tokens must not import from apps/. Layer violation.',
            },
          ],
        },
      ],

      // ── Ban hardcoded colours ──────────────────────────────
      // Matches hex colours: #fff, #ffffff, #FFF, #FFFFFF, #1677ff
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'Literal[value=/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]',
          message:
            'Hardcoded hex colour detected. Use a Design Token (e.g. var(--color-primary-500)) instead.',
        },
        {
          selector: 'Literal[value=/^rgba?\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+/i]',
          message:
            'Hardcoded rgb()/rgba() colour detected. Use a Design Token (e.g. var(--color-primary-500)) instead.',
        },
        {
          // Template literal containing a hex colour
          selector:
            'TemplateLiteral > TemplateElement[value.raw=/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})/]',
          message: 'Hardcoded hex colour in template literal. Use a Design Token instead.',
        },
      ],
    },
  },
  {
    // The design-tokens package is the single source of truth for raw
    // colour values — allow hex/rgb literals there.
    files: ['**/packages/design-tokens/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    // Test files use raw colour literals as input fixtures (e.g. testing the
    // token→CSS-variable converter). They are not UI styling and may contain
    // hex/rgb literals.
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    // packages/ui must never import from any app package.
    // Uses no-restricted-imports (pattern-based) to catch package-name
    // imports that no-restricted-paths cannot resolve.
    files: ['**/packages/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@team-portal/*-app', '@team-portal/*-app/**'],
              message:
                'packages/ui must not import from any app package. Layer violation: common → ui → apps is one-directional.',
            },
          ],
        },
      ],
    },
  },
  {
    // Common packages (utils, types, design-tokens) must never import
    // from ui or apps.
    files: [
      '**/packages/utils/**/*.{ts,tsx}',
      '**/packages/types/**/*.{ts,tsx}',
      '**/packages/design-tokens/**/*.{ts,tsx}',
      '**/packages/config-tailwind/**/*.{ts,tsx}',
      '**/packages/config-store/**/*.{ts,tsx}',
      '**/packages/icons/**/*.{ts,tsx}',
      '**/packages/i18n/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@team-portal/ui', '@team-portal/ui/**'],
              message: 'Common packages must not import from @team-portal/ui. Layer violation.',
            },
            {
              group: ['@team-portal/*-app', '@team-portal/*-app/**'],
              message: 'Common packages must not import from any app package. Layer violation.',
            },
          ],
        },
      ],
    },
  },
];
