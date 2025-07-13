/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{html,js,css}',
    './src/js/**/*.js'
  ],
  theme: {
    extend: {
      colors: {
        swarmshadow: {
          50: '#232323',
          100: '#202020',
          200: '#1F1F1F', // base
          300: '#191919',
          400: '#141414',
          500: '#0F0F0F',
          600: '#0A0A0A',
        },
        swarmlight: {
          50: '#FFFDE7',
          100: '#FFFBC2',
          200: '#FFF9C4', // base
          300: '#FFF176',
          400: '#FFEE58',
          500: '#FFE082',
          600: '#FFD54F',
        },
        swarmstripe: {
          50: '#FFFDE7',
          100: '#FFF9C4',
          200: '#FFEB3B', // base
          300: '#FDD835',
          400: '#FBC02D',
          500: '#F9A825',
          600: '#F57F17',
        },
        swarmstinger: {
          50: '#FFEBEE',
          100: '#FFCDD2',
          200: '#F44336', // base
          300: '#E57373',
          400: '#EF5350',
          500: '#D32F2F',
          600: '#B71C1C',
        },
        blackspire: {
          50: '#1A1A13',   // very dark, slight yellow
          100: '#23231A',  // dark, more yellow
          200: '#2C2C1F',  // base dark yellow-black
          300: '#363624',  // lighter
          400: '#403029',  // even lighter
          500: '#4A3A2E',  // lightest yellow-black
          600: '#000000'   // pure black
        }
      }
    }
  },
  plugins: []
};
