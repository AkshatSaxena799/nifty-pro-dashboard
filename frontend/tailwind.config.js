/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        neon: {
          green: '#00ff9d',
          red: '#ff3b5c',
          cyan: '#00d4ff',
        },
      },
    },
  },
  plugins: [],
};
