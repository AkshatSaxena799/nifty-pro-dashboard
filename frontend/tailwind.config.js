/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        data: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        neon: {
          green: '#5fd88f',
          red: '#FF5A76',
          cyan: '#cee7f5',
        },
        wcag: {
          bg: '#080C14',
          surface1: 'rgba(13, 19, 32, 0.75)',
          surface2: '#1E293B',
          border: 'rgba(206, 231, 245, 0.08)',
          text: '#FFFFFF',
          muted: '#94A3B8',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'live-ping': 'live-ping 1.8s ease-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'fade-in': 'fade-in-up 0.3s ease-out both',
        'glow': 'glow-pulse 2.5s ease-in-out infinite',
      },
      keyframes: {
        'live-ping': {
          '0%':   { transform: 'scale(1)', opacity: '0.8' },
          '70%':  { transform: 'scale(2)', opacity: '0' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        'shimmer': {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 4px 20px rgba(206, 231, 245, 0.12)' },
          '50%':       { boxShadow: '0 4px 24px rgba(206, 231, 245, 0.24)' },
        },
      },
      boxShadow: {
        'glow-cyan':  '0 0 20px rgba(206, 231, 245, 0.2)',
        'glow-green': '0 0 20px rgba(95, 216, 143, 0.2)',
        'glow-red':   '0 0 20px rgba(255, 90, 118, 0.2)',
        'premium': '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)',
      },
    },
  },
  plugins: [],
};
