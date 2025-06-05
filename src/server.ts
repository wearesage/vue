import express from "express";
import compression from "compression";
import helmet from "helmet";
import path from "path";

export function createApp(args = {} as any) {
  const config = {
    port: args?.port || process.env.PORT || 3000,
    directory: args?.directory || "public",
  };

  const app = express();

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(compression());
  app.use(express.static(config.directory));

  app.get("*", (req, res) => {
    res.sendFile(path.join(config.directory, "index.html"));
  });

  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
    console.log(`Serving static files from: ${config.directory}`);
  });

  return app;
}
