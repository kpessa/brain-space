import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        brain: {
          50: 'hsl(251, 91%, 97%)',
          100: 'hsl(250, 95%, 92%)',
          200: 'hsl(251, 95%, 85%)',
          300: 'hsl(252, 94%, 75%)',
          400: 'hsl(255, 92%, 63%)',
          500: 'hsl(258, 90%, 53%)',
          600: 'hsl(259, 84%, 44%)',
          700: 'hsl(260, 69%, 36%)',
          800: 'hsl(260, 60%, 30%)',
          900: 'hsl(260, 54%, 25%)',
        },
        space: {
          50: 'hsl(222, 100%, 97%)',
          100: 'hsl(222, 100%, 93%)',
          200: 'hsl(223, 100%, 86%)',
          300: 'hsl(224, 100%, 76%)',
          400: 'hsl(227, 100%, 64%)',
          500: 'hsl(231, 100%, 55%)',
          600: 'hsl(234, 89%, 49%)',
          700: 'hsl(235, 75%, 41%)',
          800: 'hsl(234, 62%, 34%)',
          900: 'hsl(233, 50%, 28%)',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-out': 'fadeOut 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-out': 'slideOut 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-subtle': 'pulseSubtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOut: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(168, 85, 247, 0.35), 0 0 40px rgba(168, 85, 247, 0.2)',
        'glow-lg': '0 0 30px rgba(168, 85, 247, 0.4), 0 0 60px rgba(168, 85, 247, 0.3)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
  // Disable Tailwind's reset for rapid prototyping
  corePlugins: {
    preflight: true, // Keep this true but we can override specific resets in globals.css
  },
}

export default config