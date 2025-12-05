// server/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 8000;
const N2YO_KEY = process.env.N2YO_KEY;

if (!N2YO_KEY) {
  console.warn("N2YO_KEY not set — add it to server/.env");
}

// Allow requests from dev frontend (adjust origins as needed in production)
const allowedOrigins = (process.env.CORS_ALLOW || "http://localhost:5173").split(",");

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (curl/postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = "CORS policy: The request origin is not allowed.";
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.get("/api/above", async (req, res) => {
  try {
    const { lat, lng, alt = 0, radius = 70 } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: "lat and lng are required query params" });
    }

    const upstream = `https://api.n2yo.com/rest/v1/satellite/above/${encodeURIComponent(lat)}/${encodeURIComponent(lng)}/${encodeURIComponent(alt)}/${encodeURIComponent(radius)}/0/&apiKey=${N2YO_KEY}`;

    // Node 18+ has global fetch
    const upstreamRes = await fetch(upstream);
    const contentType = upstreamRes.headers.get("content-type") || "application/json";
    const text = await upstreamRes.text();

    res.status(upstreamRes.status).header("Content-Type", contentType).send(text);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "proxy error", detail: String(err?.message || err) });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy listening on http://localhost:${PORT}  (allowed origins: ${allowedOrigins.join(",")})`);
});
