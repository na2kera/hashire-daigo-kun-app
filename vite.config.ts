import { defineConfig } from "vite";

export default defineConfig({
  base: "/",
  server: {
    // 同じ Wi-Fi のスマホから http://<MacのIP>:5173 で実機確認できるようにする
    host: true,
    port: 5173,
  },
  build: {
    target: "es2022",
    sourcemap: false,
    assetsInlineLimit: 0,
  },
});
