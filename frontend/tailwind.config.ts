import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dbe6ff',
          500: '#3b6bff',
          600: '#2f55d6',
          700: '#2542aa',
        },
      },
    },
  },
  plugins: [],
};

export default config;
