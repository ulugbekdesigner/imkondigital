import type { Config } from 'tailwindcss';
import preset from '@imkon/config/tailwind-preset';

const config: Config = {
  presets: [preset],
  content: [
    './src/**/*.{ts,tsx}',
    // Monorepo UI paketi sinflari ham skanerlansin
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
};

export default config;
