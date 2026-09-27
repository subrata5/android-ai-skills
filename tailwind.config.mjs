/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#000000',
          alt: '#050505',
          subtle: '#0a0a0a',
        },
        surface: {
          DEFAULT: '#0d0d0d',
          raised: '#111111',
          hover: '#151515',
        },
        border: {
          DEFAULT: '#222222',
          hover: '#444444',
          subtle: '#1a1a1a',
        },
        text: {
          DEFAULT: '#ededed',
          muted: '#a1a1aa',
          subtle: '#71717a',
          heading: '#ffffff',
        },
        accent: {
          DEFAULT: '#e4e4e7',
          muted: '#3f3f46',
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          '"Liberation Mono"',
          '"Courier New"',
          'monospace',
        ],
      },
      fontSize: {
        '2xs': '0.6875rem',
      },
    },
  },
  plugins: [],
};
