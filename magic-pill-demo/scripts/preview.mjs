// Serves the static export (out/) the way GitHub Pages does, under
// /Magic-Pill/, on this computer and on the local network: a phone on the
// same Wi-Fi can open it. `next dev` can't be used from another device (Next
// blocks its dev resources for other hostnames), and this is the real build.
//
// npm run preview         (builds first)
// PORT=5000 npm run preview
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import { extname, join, normalize, sep } from "node:path";

const OUT = join(import.meta.dirname, "..", "out");
const BASE = "/Magic-Pill";
const PORT = Number(process.env.PORT ?? 4173);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

if (!existsSync(OUT)) {
  console.error("No out/ folder: run `npm run build` first.");
  process.exit(1);
}

/** The file for a URL path, or null. Never outside out/. */
function resolveFile(pathname) {
  const relative = normalize(decodeURIComponent(pathname)).replace(/^([/\\])+/, "");
  const file = join(OUT, relative);
  if (file !== OUT && !file.startsWith(OUT + sep)) return null;
  if (existsSync(file) && statSync(file).isDirectory()) {
    const index = join(file, "index.html");
    return existsSync(index) ? index : null;
  }
  return existsSync(file) ? file : null;
}

const server = createServer((request, response) => {
  const { pathname } = new URL(request.url ?? "/", "http://localhost");
  if (!pathname.startsWith(BASE)) {
    response.writeHead(302, { location: `${BASE}/` });
    response.end();
    return;
  }
  let file;
  try {
    file = resolveFile(pathname.slice(BASE.length) || "/");
  } catch {
    file = null; // a malformed URL
  }
  if (!file) {
    response.writeHead(404, { "content-type": TYPES[".html"] });
    createReadStream(join(OUT, "404.html")).on("error", () => response.end("Not found")).pipe(response);
    return;
  }
  response.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream", "cache-control": "no-store" });
  createReadStream(file).pipe(response);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n  The demo, as GitHub Pages serves it:\n`);
  console.log(`  On this computer:  http://localhost:${PORT}${BASE}/`);
  const addresses = Object.values(networkInterfaces())
    .flat()
    .filter((entry) => entry && entry.family === "IPv4" && !entry.internal);
  for (const { address } of addresses) console.log(`  On your network:   http://${address}:${PORT}${BASE}/`);
  console.log(`\n  Ctrl+C to stop.\n`);
});
