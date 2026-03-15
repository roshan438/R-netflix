declare const _default: {
    darkMode: ["class"];
    content: string[];
    theme: {
        extend: {
            fontFamily: {
                sans: [string, string, string];
                display: [string, string];
            };
            colors: {
                canvas: string;
                panel: string;
                card: string;
                mist: string;
                gold: string;
                ember: string;
            };
            backgroundImage: {
                "hero-glow": string;
            };
            boxShadow: {
                halo: string;
            };
            keyframes: {
                shimmer: {
                    "0%": {
                        transform: string;
                    };
                    "100%": {
                        transform: string;
                    };
                };
                drift: {
                    "0%, 100%": {
                        transform: string;
                    };
                    "50%": {
                        transform: string;
                    };
                };
            };
            animation: {
                shimmer: string;
                drift: string;
            };
        };
    };
    plugins: any[];
};
export default _default;
