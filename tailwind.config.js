/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}', './lib/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // greenish milk-white canvas (deliberately not the generic beige)
        canvas: '#F4F7F1',
        surface: '#FFFFFF',
        // pasture / banana-leaf green
        leaf: {
          50: '#EEF6F0',
          100: '#DCEEE3',
          200: '#B9DEC9',
          300: '#8CC7A8',
          400: '#54A77F',
          500: '#2C8A61',
          600: '#1E704D',
          700: '#17573C',
          800: '#11402D',
          900: '#0B2E20',
        },
        // golden ghee accent
        ghee: {
          100: '#FBEFD6',
          200: '#F6DFAC',
          300: '#EFC878',
          400: '#E5AC46',
          500: '#D18F22',
          600: '#A96E14',
          700: '#82530F',
        },
      },
      fontFamily: {
        sans: ['var(--font-hind)', 'system-ui', 'sans-serif'],
        display: ['var(--font-tiro)', 'serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(11,46,32,0.05), 0 10px 30px -14px rgba(11,46,32,0.16)',
        lift: '0 2px 4px rgba(11,46,32,0.06), 0 16px 40px -16px rgba(11,46,32,0.24)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
