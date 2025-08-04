/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}",],
  theme: {
    extend: {
      colors: {
        primary: '#0F0F0F',     
        secondary: '#8E93FD',         
        neutral: {
          100: '#F3F4F6',
          900: '#111827',
        },
        success: '#10B981',
        error: '#EF4444',

    },
  },
  plugins: [],
}
}

