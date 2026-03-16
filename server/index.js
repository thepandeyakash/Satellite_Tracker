
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors({
  origin: "*"
}));
const PORT = process.env.PORT || 8000;
const N2YO_KEY = process.env.N2YO_KEY;

if (!N2YO_KEY) {
  console.warn("N2YO_KEY not set — add it to server/.env");
}

// Allow requests from dev frontend (adjust origins as needed in production)
const allowedOrigins = [
  "http://localhost:5173",
  "https://satellitetrackerr.vercel.app"
];


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

app.get("/api/positions", async (req, res) => {
  try {
    const { satid, lat, lng, alt = 0, seconds = 60 } = req.query;
    if (!satid || !lat || !lng) {
      return res.status(400).json({ error: "satid, lat and lng are required query params" });
    }

    const upstream = `https://api.n2yo.com/rest/v1/satellite/positions/${encodeURIComponent(
      satid
    )}/${encodeURIComponent(lat)}/${encodeURIComponent(lng)}/${encodeURIComponent(alt)}/${encodeURIComponent(seconds)}/&apiKey=${N2YO_KEY}`;

    const upstreamRes = await fetch(upstream);
    const contentType = upstreamRes.headers.get("content-type") || "application/json";
    const text = await upstreamRes.text();

    res.status(upstreamRes.status).header("Content-Type", contentType).send(text);
  } catch (err) {
    console.error("Proxy positions error:", err);
    res.status(500).json({ error: "proxy positions error", detail: String(err?.message || err) });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy listening on http://localhost:${PORT}  (allowed origins: ${allowedOrigins.join(",")})`);
});
