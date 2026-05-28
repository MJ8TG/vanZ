/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        vanz: {
          teal: '#2BBFDF',
          yellow: '#F5C800',
          navy: '#0B1021',
          iceblue: '#F0F6FA',
          green: '#22C55E',
        }
      }
    },
  },
  plugins: [],
}
