/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    screens: {
      xs: '475px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      height: {
        // Custom height for mobile content area excluding bottom navigation
        // Mobile bottom nav height is h-16 (4rem = 64px)
        app: "calc(100dvh - 4rem)",
      },
      animation: {
        "spin-slow": "spin 20s linear infinite",
        float: "float 6s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite alternate",
        "sidebar-slide-in":
          "sidebar-slide-in 500ms cubic-bezier(0.23, 1, 0.32, 1) forwards",
        "sidebar-slide-out":
          "sidebar-slide-out 500ms cubic-bezier(0.23, 1, 0.32, 1) forwards",
        "sidebar-fade-in-up": "sidebar-fade-in-up 400ms ease-out both",
        "sidebar-fade-in-up-delay-100":
          "sidebar-fade-in-up 400ms ease-out 100ms both",
        "sidebar-fade-in-up-delay-200":
          "sidebar-fade-in-up 400ms ease-out 200ms both",
        "sidebar-fade-in-up-delay-300":
          "sidebar-fade-in-up 400ms ease-out 300ms both",
        "sidebar-fade-in-up-delay-400":
          "sidebar-fade-in-up 400ms ease-out 400ms both",
        "session-fade-in": "session-fade-in 300ms ease-out both",
        "slide-in-momentum":
          "slide-in-momentum 500ms cubic-bezier(0.23, 1, 0.32, 1) forwards",
        "slide-out-momentum":
          "slide-out-momentum 500ms cubic-bezier(0.23, 1, 0.32, 1) forwards",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        glow: {
          "0%": {
            "box-shadow":
              "0 0 5px rgba(59, 130, 246, 0.5), 0 0 10px rgba(59, 130, 246, 0.3), 0 0 15px rgba(59, 130, 246, 0.2)",
          },
          "100%": {
            "box-shadow":
              "0 0 10px rgba(59, 130, 246, 0.8), 0 0 20px rgba(59, 130, 246, 0.5), 0 0 30px rgba(59, 130, 246, 0.3)",
          },
        },
        "sidebar-slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "80%": { transform: "translateX(2%)" },
          "100%": { transform: "translateX(0)" },
        },
        "sidebar-slide-out": {
          "0%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(2%)" },
          "100%": { transform: "translateX(-100%)" },
        },
        "sidebar-fade-in-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(20px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "session-fade-in": {
          "0%": {
            opacity: "0",
            transform: "translateX(-10px) scale(0.95)",
          },
          "100%": {
            opacity: "1",
            transform: "translateX(0) scale(1)",
          },
        },
        "slide-in-momentum": {
          "0%": { transform: "translateX(-100%)" },
          "80%": { transform: "translateX(2%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-out-momentum": {
          "0%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(2%)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      transitionTimingFunction: {
        sidebar: "cubic-bezier(0.23, 1, 0.32, 1)",
      },
      transitionDuration: {
        400: "400ms",
        500: "500ms",
      },
    },
  },
  plugins: [],
};
