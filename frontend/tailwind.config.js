/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#12211d', soft: '#4b5d57', faint: '#7d8d87' },
        canvas: '#edf1f0',
        surface: '#ffffff',
        line: '#d5dedb',
        pine: { DEFAULT: '#0d6b52', dark: '#09513e', tint: '#e0f0ea' },
        marigold: { DEFAULT: '#f2b233', tint: '#fff3d6' },
        brick: { DEFAULT: '#b83a28', tint: '#fbe8e4' },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
