module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          primary: '#00F0FF',
          secondary: '#8A2BE2',
          accent: '#FF5500',
        },
        surface: {
          base: '#030303',
          elevated: '#0A0A0A',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      backdropBlur: {
        '2xl': '40px',
        '3xl': '64px',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(0, 240, 255, 0.4)',
        'neon-purple': '0 0 15px rgba(138, 43, 226, 0.4)',
        'neon-orange': '0 0 15px rgba(255, 85, 0, 0.4)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
      borderColor: {
        DEFAULT: 'rgba(255, 255, 255, 0.1)',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
};
