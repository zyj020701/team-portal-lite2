/**
 * Cross-platform wrapper for `next build` with bundle analysis enabled.
 *
 * `ANALYZE=true` is read by `@next/bundle-analyzer` in next.config.js.
 * Using this small Node script avoids a dependency on `cross-env` and works
 * on Windows PowerShell, macOS and Linux.
 *
 * Usage: pnpm build:analyze
 */
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const args = ['run', 'build'];

const result = spawnSync(command, args, {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit',
  env: { ...process.env, ANALYZE: 'true' },
  shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);
