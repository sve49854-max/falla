import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, "dist");
const port = Number(process.env.PORT) || 4173;

function build() {
  const result = spawnSync("npx", ["vite", "build"], {
    cwd: root,
    stdio: "inherit",
    shell: true,
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

if (!fs.existsSync(path.join(dist, "index.html"))) {
  build();
}

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".woff2": "font/woff2",
};

function resolveFile(urlPath) {
  const clean = decodeURIComponent((urlPath || "/").split("?")[0]);
  let file = clean === "/" ? "/index.html" : clean;
  if (file === "/panel" || file === "/banca") {
    file = "/banca.html";
  }
  if (file.endsWith("/")) file += "index.html";
  const full = path.normalize(path.join(dist, file));
  if (!full.startsWith(dist)) return null;
  return full;
}

http
  .createServer((req, res) => {
    const file = resolveFile(req.url);
    if (!file) {
      res.writeHead(400);
      res.end("Bad request");
      return;
    }

    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Not found");
        return;
      }
      res.writeHead(200, {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
      });
      res.end(data);
    });
  })
  .listen(port, "0.0.0.0", () => {
    console.log(`Serving ${dist} on 0.0.0.0:${port}`);
  });
