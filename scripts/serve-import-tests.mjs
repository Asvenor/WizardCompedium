import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
const root = path.resolve("dist");
const port = Number(process.env.CHARACTER_IMPORT_PORT || 4331);
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".json": "application/json",
  ".css": "text/css",
  ".wasm": "application/wasm",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};
createServer(async (req, res) => {
  try {
    let p = path.resolve(
      root,
      "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
    );
    if (!p.startsWith(root + path.sep) && p !== root) throw Error();
    if ((await stat(p)).isDirectory()) p = path.join(p, "index.html");
    const body = await readFile(p);
    res.writeHead(200, {
      "Content-Type": mime[path.extname(p)] ?? "application/octet-stream",
    });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}).listen(port, "127.0.0.1", () =>
  console.log(`Local import test preview: http://127.0.0.1:${port}`),
);
