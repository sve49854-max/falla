import { defineConfig } from "vite";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    {
      name: "rewrite-panel",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url.split("?")[0];
          if (url === "/panel" || url === "/banca") {
            req.url = "/banca.html";
          }
          next();
        });
      },
    },
  ],
  server: {
    port: 5173,
    open: true,
    allowedHosts: [".onrender.com"],
  },
  preview: {
    host: true,
    allowedHosts: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, "index.html"),
        banca: resolve(root, "banca.html"),
        panel: resolve(root, "panel.html"),
      },
    },
  },
});
