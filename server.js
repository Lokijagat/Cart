import "@shopify/shopify-app-react-router/adapters/node";
import { createRequestHandler } from "@react-router/express";
import compression from "compression";
import express from "express";

// No top-level await: Hostinger's LiteSpeed runner loads the entry file with
// require(), which cannot load an ES module that uses top-level await.
async function start() {
  const BUILD_PATH = "./build/server/index.js";
  const build = await import(BUILD_PATH);
  const port = Number(process.env.PORT) || 3000;

  const app = express();
  app.disable("x-powered-by");
  app.use(compression());
  app.use(
    "/assets",
    express.static("build/client/assets", { immutable: true, maxAge: "1y" }),
  );
  app.use(express.static("build/client", { maxAge: "1h" }));
  app.use(express.static("public", { maxAge: "1h" }));
  app.all(
    "*",
    createRequestHandler({ build, mode: process.env.NODE_ENV }),
  );

  app.listen(port, () => console.log(`Mixmach app running on port ${port}`));
}

start().catch((e) => {
  console.error("Failed to start:", e);
  process.exit(1);
});
