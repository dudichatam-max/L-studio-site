/**
 * Prepare GitHub Pages SPA deep-link fallbacks.
 * Writes dist/public/index.html, 404.html, and route folders so each public
 * path returns HTTP 200 with the right canonical, title, and hreflang.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { applySeoToHtml, renderSitemapXml, seoDocument } from "../shared/seo";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "dist", "public");
const indexPath = join(publicDir, "index.html");

if (!existsSync(indexPath)) {
  console.error(`Missing ${indexPath}. Run pnpm build first.`);
  process.exit(1);
}

const template = readFileSync(indexPath, "utf8");

const targets: Array<{ file: string; path: string }> = [
  { file: "index.html", path: "/" },
  { file: "404.html", path: "/404" },
  { file: "privacy/index.html", path: "/privacy/" },
  { file: "terms/index.html", path: "/terms/" },
  { file: "guide/index.html", path: "/guide/" },
  { file: "factory-64/index.html", path: "/factory-64/" },
  { file: "factory-64/drums/index.html", path: "/factory-64/drums/" },
  { file: "exclusive/index.html", path: "/exclusive/" },
  { file: "updates/index.html", path: "/updates/" },
  { file: "buy/index.html", path: "/buy/" },
  { file: "buy/success/index.html", path: "/buy/success/" },
];

for (const target of targets) {
  const dest = join(publicDir, target.file);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, applySeoToHtml(template, seoDocument(target.path, "en")));
  console.log(`Prepared ${dest}`);
}

writeFileSync(join(publicDir, "sitemap.xml"), renderSitemapXml(), "utf8");
console.log(`Prepared ${join(publicDir, "sitemap.xml")}`);

writeFileSync(join(publicDir, "CNAME"), "l-studio.studio\n", "utf8");
console.log(`Prepared ${join(publicDir, "CNAME")}`);

console.log("GitHub Pages SPA fallbacks ready.");
