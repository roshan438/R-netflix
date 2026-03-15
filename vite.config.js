import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: function (id) {
                    if (!id.includes("node_modules")) {
                        return;
                    }
                    if (id.includes("firebase")) {
                        return "firebase";
                    }
                    if (id.includes("framer-motion")) {
                        return "motion";
                    }
                    if (id.includes("react-router")) {
                        return "router";
                    }
                    if (id.includes("lucide-react")) {
                        return "icons";
                    }
                    if (id.includes("react") || id.includes("scheduler")) {
                        return "react-vendor";
                    }
                    return "vendor";
                },
            },
        },
    },
});
