export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#1D9E75', light: '#5DCAA5', dark: '#0F6E56' }
      },
      fontFamily: { mono: ['JetBrains Mono', 'monospace'] }
    }
  },
  plugins: []
}
