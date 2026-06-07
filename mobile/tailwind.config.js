/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        vanz: {
          teal: '#38B6FF',
          'teal-dark': '#2196D6',
          'teal-glow': '#38B6FF33',
          yellow: '#F5C800',
          'yellow-dark': '#D4AD00',
          'yellow-glow': '#F5C80033',
          navy: '#0B1021',
          'navy-light': '#131B36',
          'navy-mid': '#1A2444',
          iceblue: '#F0F6FA',
          'iceblue-dark': '#E4EDF3',
          green: '#22C55E',
          'green-dark': '#16A34A',
          'card-glass': 'rgba(255,255,255,0.92)',
        }
      },
      borderRadius: {
        'card': '24px',
        '4xl': '32px',
      },
      fontSize: {
        '2xs': ['10px', '14px'],
      },
      boxShadow: {
        'card': '0 2px 16px rgba(11,16,33,0.06)',
        'elevated': '0 8px 32px rgba(11,16,33,0.10)',
        'glow-teal': '0 4px 24px rgba(56,182,255,0.25)',
        'glow-yellow': '0 4px 24px rgba(245,200,0,0.25)',
        'glow-green': '0 4px 24px rgba(34,197,94,0.25)',
      },
    },
  },
  plugins: [],
}
