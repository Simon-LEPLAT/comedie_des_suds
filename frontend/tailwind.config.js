module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#800000", // Rouge Bordeaux (keeping your existing primary)
        secondary: "#B22222", // Rouge velours
        accent: "#8B0000", // Rouge profond
        gold: "#D4AF37", // Gold accent
        navy: "#0A1128", // Deep navy for contrast
        charcoal: "#36454F", // Charcoal for text
        offwhite: "#FFFFFF", // Changed to pure white instead of cream
      },
    },
  },
  plugins: [],
}

