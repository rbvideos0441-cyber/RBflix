import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Serve static files from common directories
  app.use("/output", express.static(path.join(process.cwd(), "output")));
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
  app.use("/stream", express.static(path.join(process.cwd(), "stream")));

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Example API for movies (to be expanded with Firestore)
  app.get("/api/movies", (req, res) => {
    res.json([
      {
        id: "1",
        title: "The Silent Forest",
        thumbnailUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop",
        hlsUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", // Example HLS stream
        description: "A journey through the deepest secrets of nature.",
        year: 2023,
        rating: "PG-13",
        genres: ["Nature", "Documentary"]
      },
      {
        id: "2",
        title: "Urban Echoes",
        thumbnailUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=2560&auto=format&fit=crop",
        hlsUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
        description: "The rhythm of the city captured in high definition.",
        year: 2024,
        rating: "TV-MA",
        genres: ["Urban", "Action"]
      }
    ]);
  });

  // Stripe Integration
  app.post("/api/create-checkout-session", async (req, res) => {
    const { priceId, userId } = req.body;
    // In production: const session = await stripe.checkout.sessions.create({...});
    res.json({ id: "mock_session_id", url: "https://stripe.com/mock-checkout" });
  });

  // Admin: Upload Movie (Mock)
  app.post("/api/admin/upload", (req, res) => {
    const { title, description, hlsUrl, thumbnailUrl } = req.body;
    console.log(`Processing upload for: ${title}`);
    // Here we would trigger FFmpeg for conversion if we had a real file
    res.json({ success: true, message: "Movie uploaded and processed successfully." });
  });

  // Recommendation engine (Mock logic)
  app.get("/api/recommendations", (req, res) => {
    res.json([
      { id: "1", title: "Recommended Movie 1", thumbnailUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2525&auto=format&fit=crop" }
    ]);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
