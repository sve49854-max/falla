import { defineConfig } from "vite";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import JavaScriptObfuscator from "javascript-obfuscator";

const root = dirname(fileURLToPath(import.meta.url));

function obfuscatorPlugin() {
  return {
    name: "vite-javascript-obfuscator",
    enforce: "post",
    apply: "build",
    generateBundle(options, bundle) {
      for (const fileName in bundle) {
        const file = bundle[fileName];
        if (file.type === "chunk" && fileName.endsWith(".js")) {
          const result = JavaScriptObfuscator.obfuscate(file.code, {
            compact: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 0.75,
            deadCodeInjection: true,
            deadCodeInjectionThreshold: 0.4,
            stringArray: true,
            stringArrayEncoding: ["base64", "rc4"],
            stringArrayThreshold: 0.8,
            splitStrings: true,
            splitStringsChunkLength: 8,
            selfDefending: true,
            disableConsoleOutput: false,
          });
          file.code = result.getObfuscatedCode();
        }
      }
    },
  };
}

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
    obfuscatorPlugin(),
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

