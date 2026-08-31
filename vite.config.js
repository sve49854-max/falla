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
            controlFlowFlatteningThreshold: 0.4,
            numbersToExpressions: true,
            simplify: true,
            stringArray: true,
            stringArrayCallsTransform: true,
            stringArrayCallsTransformThreshold: 0.5,
            stringArrayEncoding: ["base64"],
            stringArrayIndexShift: true,
            stringArrayRotate: true,
            stringArrayShuffle: true,
            stringArrayWrappersCount: 2,
            stringArrayWrappersType: "variable",
            stringArrayThreshold: 0.75,
            splitStrings: true,
            splitStringsChunkLength: 10,
            transformObjectKeys: true,
            selfDefending: false,
            deadCodeInjection: false,
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

