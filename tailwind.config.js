export default {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            fontFamily: {
                sans: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
                display: ["'Cormorant Garamond'", "serif"],
            },
            colors: {
                canvas: "#05070d",
                panel: "#0b1020",
                card: "#0f1727",
                mist: "#d8d4d1",
                gold: "#cfb07a",
                ember: "#ff8d6d",
            },
            backgroundImage: {
                "hero-glow": "radial-gradient(circle at top, rgba(207,176,122,0.24), transparent 35%), radial-gradient(circle at 20% 20%, rgba(255,141,109,0.14), transparent 30%), linear-gradient(180deg, #09101d 0%, #05070d 60%, #020409 100%)",
            },
            boxShadow: {
                halo: "0 24px 80px rgba(207, 176, 122, 0.15)",
            },
            keyframes: {
                shimmer: {
                    "0%": { transform: "translateX(-120%)" },
                    "100%": { transform: "translateX(120%)" },
                },
                drift: {
                    "0%, 100%": { transform: "translate3d(0, 0, 0)" },
                    "50%": { transform: "translate3d(0, -12px, 0)" },
                },
            },
            animation: {
                shimmer: "shimmer 2.4s linear infinite",
                drift: "drift 8s ease-in-out infinite",
            },
        },
    },
    plugins: [],
};
