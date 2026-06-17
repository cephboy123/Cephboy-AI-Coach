import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import motivateHandler from "./api/motivate";

dotenv.config();

// Simple adapter to map express Request/Response to Vercel Serverless Function format
const vercelAdapter = (handler: any) => {
  return async (req: Request, res: Response) => {
    try {
      await handler(req, res);
    } catch (err: any) {
      console.error("Adapter Routing Error:", err);
      res.status(500).json({ error: err.message || "Adapter failed." });
    }
  };
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mount adapted Vercel API handlers directly for our local Express & Dev environment
  app.post("/api/motivate", vercelAdapter(motivateHandler));

  // Serve static UI assets and handle hot reloading or routing
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Cephboy Coach Server is online on port ${PORT}`);
  });
}

startServer();

