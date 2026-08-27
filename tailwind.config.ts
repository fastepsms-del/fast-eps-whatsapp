import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d9eaff",
          200: "#bcdaff",
          300: "#8ec2ff",
          400: "#589eff",
          500: "#2f78ff",
          600: "#1a58f0",
          700: "#1544c2",
          800: "#173a99",
          900: "#18357a",
        },
      },
    },
  },
  plugins: [],
};

export default config;
