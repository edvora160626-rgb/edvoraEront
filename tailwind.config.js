/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    screens: {
      xs: { max: "479px" },

      sm: {
        min: "480px",
        max: "639px",
      },

      md: {
        min: "640px",
        max: "1023px",
      },

      lg: {
        min: "1024px",
        max: "1439px",
      },

      xl: {
        min: "1440px",
        max: "1919px",
      },

      "2xl": {
        min: "1920px",
        max: "2559px",
      },

      "3xl": {
        min: "2560px",
        max: "3839px",
      },

      "4xl": {
        min: "3840px",
        max: "7679px",
      },

      "5xl": {
        min: "7680px",
      },
    },

    extend: {
      colors: {
        primary: "#8B5CF6",
        secondary: "#C4B5FD",
        accent: "#A855F7",

        "primary-hover": "#7C3AED",
        "secondary-hover": "#A78BFA",

        card: "#F5EEFF",
        "card-dark": "#E9D5FF",

        textPrimary: "#2E1065",
        textSecondary: "#6D28D9",
      },
    },
  },

  plugins: [],
};