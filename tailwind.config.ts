import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#080503',
        paper: '#0f0c09',
        surface: '#141008',
        red: {
          DEFAULT: '#b02a1e',
          dim: '#6b1a10',
          faint: '#1e0a07',
          logo: '#c0392b',
        },
        gold: {
          DEFAULT: '#c8960a',
          dim: '#4a3508',
        },
        cream: '#ede5d8',
        muted: '#9a9a9a',
        faint: '#1a1410',
      },
      fontFamily: {
        display: ['var(--font-bebas)', 'sans-serif'],
        body: ['var(--font-goudy)', 'serif'],
        mono: ['var(--font-dm-mono)', 'monospace'],
        serif: ['var(--font-playfair)', 'serif'],
      },
      letterSpacing: {
        widest2: '0.2em',
        widest3: '0.3em',
      },
    },
  },
  plugins: [],
}

export default config
