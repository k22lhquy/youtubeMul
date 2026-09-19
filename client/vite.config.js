const { defineConfig } = require("vite");
const react = require("@vitejs/plugin-react");
const tailwindcss = require("@tailwindcss/vite").default;

module.exports = defineConfig({
  root: __dirname,
  plugins: [react(), tailwindcss()],
  server: { host: true, proxy: { "/api": "http://localhost:3000", "/socket.io": { target: "ws://localhost:3000", ws: true } } },
});
