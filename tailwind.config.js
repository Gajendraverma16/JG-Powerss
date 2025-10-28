// tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx,css}",
    "./src/components/tiptap-templates/simple/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
       screens: {
      custom: '1322px', // your custom breakpoint
    },
      fontFamily: {
        sans: ['"SF Pro Display"', 'Montserrat', 'ui-sans-serif', 'system-ui'],
        sfpro: ['"SF Pro Display"', 'sans-serif'],
        mont: ['Montserrat', 'sans-serif'],
         quicksand: ['Quicksand', 'sans-serif'],
      },

    },
  },
  plugins: [],
}
