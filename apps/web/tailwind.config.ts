import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4a7c59',
          50: '#f0f5f1',
          100: '#dce8de',
          200: '#bbd5bf',
          300: '#8fb89a',
          400: '#6a9b77',
          500: '#4a7c59',
          600: '#3b6346',
          700: '#2f4f38',
          800: '#273c2e',
          900: '#213226',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        surface: {
          DEFAULT: '#F8FAFC',
          50: '#FFFFFF',
          100: '#F1F5F9',
          200: '#E2E8F0',
        },
      },
      fontFamily: {
        sans: ['Nunito Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
