import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './context/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f0f1e',
        surface: '#1f1f2e',
        border: '#3d3d4d',
        primary: '#a78bfa',
        secondary: '#7c3aed',
        foreground: '#e5e7eb',
        muted: '#9ca3af',
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'sans-serif'],
      },
      maxWidth: {
        mobile: '480px',
      },
    },
  },
  plugins: [],
};

export default config;
