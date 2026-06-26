module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        bg: "#07111f",
        panel: "#0d1728",
        panelSoft: "#12203a",
        border: "rgba(148, 163, 184, 0.16)",
        accent: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
        },
        warn: "#f59e0b",
        danger: "#ef4444",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(52, 211, 153, 0.12), 0 18px 60px rgba(2, 8, 23, 0.45)",
      },
      backgroundImage: {
        "dashboard-gradient": "radial-gradient(circle at top left, rgba(34,197,94,0.08), transparent 28%), radial-gradient(circle at top right, rgba(59,130,246,0.08), transparent 26%), linear-gradient(180deg, hsl(var(--b3)) 0%, hsl(var(--b1)) 100%)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["forest"],
  },
};
