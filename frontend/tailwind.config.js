export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        charcoal: '#1f2933',
        blush: '#fce7f3',
        rose: '#f472b6',
        gold: '#fbbf24'
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"Noto Sans SC"', 'sans-serif']
      },
      boxShadow: {
        luxe: '0 20px 45px -20px rgba(15, 23, 42, 0.35)'
      }
    }
  },
  plugins: []
};
