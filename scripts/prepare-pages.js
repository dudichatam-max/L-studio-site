#!/usr/bin/env node
/**
 * Prepare GitHub Pages SPA deep-link fallbacks.
 * Copies dist/public/index.html to 404.html and to route folders
 * so /privacy, /terms, /guide, /factory-64, /factory-64/drums, /buy and /buy/success return HTTP 200 with the SPA shell.
 */
import { copyFileSync, mkdirSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "dist", "public");
const indexHtml = join(publicDir, "index.html");

if (!existsSync(indexHtml)) {
  console.error(`Missing ${indexHtml}. Run pnpm build first.`);
  process.exit(1);
}

const targets = [
  join(publicDir, "404.html"),
  join(publicDir, "privacy", "index.html"),
  join(publicDir, "terms", "index.html"),
  join(publicDir, "guide", "index.html"),
  join(publicDir, "factory-64", "index.html"),
  join(publicDir, "factory-64", "drums", "index.html"),
  join(publicDir, "buy", "index.html"),
  join(publicDir, "buy", "success", "index.html"),
];

for (const target of targets) {
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(indexHtml, target);
  console.log(`Prepared ${target}`);
}

// Custom domain for GitHub Pages (Actions artifact must include CNAME)
const cnamePath = join(publicDir, "CNAME");
writeFileSync(cnamePath, "l-studio.studio\n", "utf8");
console.log(`Prepared ${cnamePath}`);

console.log("GitHub Pages SPA fallbacks ready.");
