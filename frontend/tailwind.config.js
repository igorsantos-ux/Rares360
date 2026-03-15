/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#8A9A5B", // Moss Green
                secondary: "#697D58", // Reseda Green
                accent: "#DEB587", // Dun
                background: "#F0EAD6", // Eggshell
                surface: "#FFFFFF",
                text: {
                    primary: "#1A202C",
                    secondary: "#4A5568",
                    muted: "#718096"
                }
            },
            fontSize: {
                'h1': ['80px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' }],
                'h2': ['54px', { lineHeight: '1.2', fontWeight: '500' }],
                'h3': ['40px', { lineHeight: '1.2', fontWeight: '500' }],
                'body-lg': ['18px', { lineHeight: '1.5', fontWeight: '400' }],
            },
            maxWidth: {
                'container': '1208px',
            },
            borderRadius: {
                'design': '20px',
            },
            spacing: {
                'section': '120px',
            }
        },
    },
    plugins: [],
}
