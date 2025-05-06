/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors:{
        rule:{
          'bg':'#edf2f1',
          60:'#ffffff',
          30:'#18111f',
          10:'#8800ff'
        }
      }
    },
  },
  plugins: [],
}