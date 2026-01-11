/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  // Important: Use important selector to scope all styles to .rcs-root
  important: '.rcs-root',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--rcs-radius)",
        md: "calc(var(--rcs-radius) - 2px)",
        sm: "calc(var(--rcs-radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--rcs-background))",
        foreground: "hsl(var(--rcs-foreground))",
        card: {
          DEFAULT: "hsl(var(--rcs-card))",
          foreground: "hsl(var(--rcs-card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--rcs-card))",
          foreground: "hsl(var(--rcs-card-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--rcs-primary))",
          foreground: "hsl(var(--rcs-primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--rcs-secondary))",
          foreground: "hsl(var(--rcs-secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--rcs-muted))",
          foreground: "hsl(var(--rcs-muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--rcs-accent))",
          foreground: "hsl(var(--rcs-accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--rcs-destructive))",
          foreground: "hsl(var(--rcs-destructive-foreground))",
        },
        border: "hsl(var(--rcs-border))",
        input: "hsl(var(--rcs-input))",
        ring: "hsl(var(--rcs-ring))",
      },
    },
  },
  plugins: [],
}
