/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#ff6a00',
          600: '#ea580c',
          900: '#7c2d12',
        },
        accent: '#ff6a00',
        background: 'var(--color-bg)',
        foreground: 'var(--color-text-main)',
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
        muted: 'var(--color-text-muted)',
      },
      fontFamily: {
        display: ['var(--font-cormorant)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
