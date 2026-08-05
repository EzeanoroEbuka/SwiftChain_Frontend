// @ts-ignore - Tailwind CSS v4 type resolution
import type { Config } from 'tailwindcss';

// Tailwind CSS configuration
const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: '#0066FF',
          dark: '#004Cbf',
          light: '#3385ff',
          50: '#e5f0ff',
          100: '#cce0ff',
          500: '#0066FF',
          900: '#002966',
        },
        secondary: {
          DEFAULT: '#F59E0B',
          dark: '#D97706',
        },
        success: {
          DEFAULT: '#10B981',
          dark: '#059669',
        },
      },
    },
  },
  plugins: [],
};
export default config;
