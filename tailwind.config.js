/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#ff0080',
        secondary: '#00ff00',
        accent: '#ff69b4',
        black: '#000000',
        white: '#ffffff',
        'gray-100': '#f5f5f5',
        'gray-800': '#1a1a1a',
      },
      fontFamily: {
        primary: ['Space Grotesk', 'monospace'],
      },
      boxShadow: {
        'brutal': '4px 4px 0px #000',
        'brutal-hover': '8px 8px 0px #000',
        'brutal-pink': '4px 4px 0px #ff0080',
        'brutal-lg': '6px 6px 0px #000',
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        'pulse-slow': 'pulse 3s infinite',
      },
    },
  },
  plugins: [],
}