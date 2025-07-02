/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./public/index.html", // ✅ correto agora
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
