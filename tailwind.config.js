/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./ui.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif']
      },
      colors: {
        'ds-black': '#000000',
        'ds-white': '#FFFFFF',
        'ds-gray-100': '#1E1E1C',
        'ds-gray-200': '#2C2C2A',
        'ds-gray-300': '#3D3E3C',
        'ds-gray-400': '#656664',
        'ds-gray-500': '#D1D2D2',
        'ds-gray-600': '#E5E7EB',
        'ds-gray-700': '#EAEAE8',
        'ds-purple-100': '#99648F',
        'ds-purple-200': '#B792B0',
        'ds-teal-100': '#649795',
        'ds-teal-200': '#609593',
        'ds-teal-300': '#609693',
        'ds-blue-100': '#B5DFE7',
        'ds-yellow-100': '#FFF0A8'
      },
      dropShadow: {
        widget: '0 4px 4px rgba(0, 0, 0, 0.25)'
      }
    }
  },
  plugins: [],
} 