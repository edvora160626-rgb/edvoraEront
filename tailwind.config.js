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
        primary: "#A77A95",
        secondary: "#C3C3D5",
        accent: "#F5D69B",

        "primary-hover": "#8F6580",
        "primary-deep": "#735366",
        "primary-soft": "#FAEEE9",
        "primary-muted": "#FAEEE9",
        "primary-border": "#C3C3D5",

        "secondary-hover": "#A77A95",
        "secondary-soft": "#E8E8F0",

        "accent-hover": "#D4B87A",
        "accent-soft": "#FAEEE9",
        "accent-bright": "#F5D69B",

        card: "#FFFFFF",
        "card-dark": "#C3C3D5",

        textPrimary: "#735366",
        textSecondary: "#A77A95",

        surface: "#FAEEE9",
        "surface-tint": "#FAEEE9",
      },
    },
  },

  plugins: [],
};
