import type { Config } from 'tailwindcss';
// Import the preset from source rather than the built dist/ export. This
// file is loaded by Tailwind/PostCSS via jiti (which compiles TS on the fly)
// at build time; resolving to src avoids a hard dependency on the
// config-tailwind package having been compiled before web-app build starts,
// and works on both Windows and Linux CI.
// eslint-disable-next-line import/no-relative-packages
import { tailwindPreset } from '../../packages/config-tailwind/src';

const config: Config = {
  presets: [tailwindPreset as Config],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
};

export default config;
