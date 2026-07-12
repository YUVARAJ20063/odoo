/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Module Color Identities
        assets: {
          light: '#eff6ff',
          DEFAULT: '#3b82f6',
          dark: '#1d4ed8',
        },
        employees: {
          light: '#ecfdf5',
          DEFAULT: '#10b981',
          dark: '#047857',
        },
        maintenance: {
          light: '#fff7ed',
          DEFAULT: '#f97316',
          dark: '#c2410c',
        },
        bookings: {
          light: '#faf5ff',
          DEFAULT: '#8b5cf6',
          dark: '#6d28d9',
        },
        reports: {
          light: '#eef2ff',
          DEFAULT: '#6366f1',
          dark: '#4338ca',
        },
        notifications: {
          light: '#fefce8',
          DEFAULT: '#eab308',
          dark: '#a16207',
        },
        settings: {
          light: '#f8fafc',
          DEFAULT: '#64748b',
          dark: '#475569',
        },
        enterprise: {
          bg: {
            light: '#f8fafc',
            dark: '#0f172a',
          },
          panel: {
            light: '#ffffff',
            dark: '#1e293b',
          },
          border: {
            light: '#e2e8f0',
            dark: '#334155',
          },
          text: {
            light: '#0f172a',
            dark: '#f8fafc',
            mutedLight: '#64748b',
            mutedDark: '#94a3b8',
          }
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        enterprise: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'enterprise-hover': '0 10px 30px -3px rgba(0, 0, 0, 0.1)',
        'enterprise-dark': '0 4px 20px -2px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
}
