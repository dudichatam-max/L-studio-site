import express from "express";
import { createServer } from "http";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "url";
import { applySeoToHtml, languageFromSearch, seoDocument } from "../shared/seo";
import { attachCommerceApi, prepareCommerce } from "./commerce";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  await prepareCommerce();
  attachCommerceApi(app);

  // Serve static files from dist/public in production.
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use((req, res, next) => {
    if (req.path.toLowerCase().endsWith(".apk")) {
      res.status(404).end();
      return;
    }
    next();
  });

  const indexTemplatePath = path.join(staticPath, "index.html");
  let indexTemplate = "";
  const sendSpa = (
    res: express.Response,
    pathname: string,
    originalUrl: string
  ) => {
    if (!indexTemplate)
      indexTemplate = fs.readFileSync(indexTemplatePath, "utf8");
    const language = languageFromSearch(originalUrl) ?? "en";
    const html = applySeoToHtml(indexTemplate, seoDocument(pathname, language));
    res.status(200).type("html").send(html);
  };

  app.get(["/", "/index.html"], (req, res) => {
    sendSpa(res, "/", req.originalUrl);
  });

  app.use(express.static(staticPath));

  // Client routes stay on the SPA. API misses already returned JSON above.
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api/")) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    sendSpa(res, req.path, req.originalUrl);
  });

  const port = Number(process.env.PORT) || 3000;
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
  });
}

startServer().catch(error => {
  console.error(error);
  process.exit(1);
});
