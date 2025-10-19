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
        neuro: {
          bg: {
            light: '#F2F2F2',
            dark: '#0E0E0E',
          },
          surface: {
            light: '#FCFCFC',
            dark: '#181818',
          },
          text: {
            primary: {
              light: '#151515',
              dark: '#F1F1F1',
            },
            secondary: {
              light: '#636363',
              dark: '#A1A1A1',
            },
            muted: {
              light: '#9A9A9A',
              dark: '#6F6F6F',
            },
          },
          border: {
            light: '#E2E2E2',
            dark: '#2C2C2C',
          },
          accent: {
            light: '#B5B5B5',
            dark: '#9B9B9B',
          },
        },
        primary: {
          50: '#F7F7F7',
          100: '#ECECEC',
          200: '#DCDCDC',
          300: '#C2C2C2',
          400: '#A8A8A8',
          500: '#8F8F8F',
          600: '#6F6F6F',
          700: '#5A5A5A',
          800: '#454545',
          900: '#2F2F2F',
        },
        secondary: {
          50: '#F6F6F6',
          100: '#E9E9E9',
          200: '#D3D3D3',
          300: '#B9B9B9',
          400: '#A0A0A0',
          500: '#878787',
          600: '#6D6D6D',
          700: '#555555',
          800: '#3F3F3F',
          900: '#2A2A2A',
        },
      },
      backgroundImage: {
        'neuro-gradient': 'linear-gradient(135deg, #F4F4F4 0%, #E0E0E0 100%)',
        'neuro-subtle': 'linear-gradient(145deg, #F0F0F0 0%, #D8D8D8 100%)',
      },
      boxShadow: {
        'neuro-light': '6px 6px 12px #D0D0D0, -6px -6px 12px #FFFFFF',
        'neuro-light-sm': '3px 3px 6px #D0D0D0, -3px -3px 6px #FFFFFF',
        'neuro-light-lg': '9px 9px 18px #C7C7C7, -9px -9px 18px #FFFFFF',
        'neuro-light-inset': 'inset 4px 4px 8px #D0D0D0, inset -4px -4px 8px #FFFFFF',
        'neuro-light-hover': '8px 8px 16px #C0C0C0, -8px -8px 16px #FFFFFF',
        'neuro-dark': '6px 6px 12px #050505, -6px -6px 12px #1F1F1F',
        'neuro-dark-sm': '3px 3px 6px #050505, -3px -3px 6px #1F1F1F',
        'neuro-dark-lg': '9px 9px 18px #040404, -9px -9px 18px #262626',
        'neuro-dark-inset': 'inset 4px 4px 8px #050505, inset -4px -4px 8px #1C1C1C',
        'neuro-dark-hover': '8px 8px 16px #030303, -8px -8px 16px #262626',
        'neuro-accent': '4px 4px 8px rgba(128, 128, 128, 0.15)',
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
