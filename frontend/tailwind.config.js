/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Fredoka', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Inter', 'sans-serif'],
      },
      colors: {
        // Minimal neumorphic color palette
        neuro: {
          bg: {
            light: '#E8ECF1',
            dark: '#1A1D23',
          },
          surface: {
            light: '#F5F7FA',
            dark: '#252932',
          },
          text: {
            primary: {
              light: '#1F2937',
              dark: '#F3F4F6',
            },
            secondary: {
              light: '#6B7280',
              dark: '#9CA3AF',
            },
            muted: {
              light: '#9CA3AF',
              dark: '#6B7280',
            },
          },
          border: {
            light: '#E5E7EB',
            dark: '#374151',
          },
          accent: {
            light: '#3B82F6',
            dark: '#60A5FA',
          },
        },
        // Keep original colors for backwards compatibility
        primary: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A855F7',
          600: '#9333EA',
          700: '#7E22CE',
          800: '#6B21A8',
          900: '#581C87',
        },
        secondary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
      },
      backgroundImage: {
        'neuro-gradient': 'linear-gradient(135deg, #E4E9F2 0%, #D8DFE8 100%)',
        'neuro-subtle': 'linear-gradient(145deg, #F0F4F8 0%, #D9E2EC 100%)',
      },
      boxShadow: {
        // Light mode neumorphic shadows
        'neuro-light': '6px 6px 12px #D1D5DB, -6px -6px 12px #FFFFFF',
        'neuro-light-sm': '3px 3px 6px #D1D5DB, -3px -3px 6px #FFFFFF',
        'neuro-light-lg': '9px 9px 18px #D1D5DB, -9px -9px 18px #FFFFFF',
        'neuro-light-inset': 'inset 4px 4px 8px #D1D5DB, inset -4px -4px 8px #FFFFFF',
        'neuro-light-hover': '8px 8px 16px #C4C9D1, -8px -8px 16px #FFFFFF',

        // Dark mode neumorphic shadows
        'neuro-dark': '6px 6px 12px #0F1115, -6px -6px 12px #2A2F3A',
        'neuro-dark-sm': '3px 3px 6px #0F1115, -3px -3px 6px #2A2F3A',
        'neuro-dark-lg': '9px 9px 18px #0F1115, -9px -9px 18px #2A2F3A',
        'neuro-dark-inset': 'inset 4px 4px 8px #0F1115, inset -4px -4px 8px #2A2F3A',
        'neuro-dark-hover': '8px 8px 16px #0A0C0F, -8px -8px 16px #2A2F3A',

        // Accent shadows
        'neuro-accent': '4px 4px 8px rgba(59, 130, 246, 0.15)',
      },
      borderRadius: {
        'neuro': '20px',
        'neuro-sm': '12px',
        'neuro-lg': '28px',
        'neuro-xl': '36px',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-down': 'slideDown 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-left': 'slideLeft 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-right': 'slideRight 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-subtle': 'bounceSubtle 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'press': 'press 0.1s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(30px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-30px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        press: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.98)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-soft': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        '400': '400ms',
      },
    },
  },
  plugins: [],
}
