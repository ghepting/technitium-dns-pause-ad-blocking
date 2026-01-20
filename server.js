import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Proxy endpoint
app.post("/api/pause", async (req, res) => {
  const { minutes } = req.body;
  const token = process.env.TECHNITIUM_DNS_API_TOKEN;

  if (!process.env.TECHNITIUM_DNS_SERVER_URL) {
    return res
      .status(500)
      .json({ error: "Server configuration error: Missing DNS Server URL" });
  }

  if (!token) {
    return res
      .status(500)
      .json({ error: "Server configuration error: Missing API Token" });
  }

  if (!minutes) {
    return res.status(400).json({ error: "Missing duration (minutes)" });
  }

  try {
    const apiUrl = `${process.env.TECHNITIUM_DNS_SERVER_URL}/api/settings/temporaryDisableBlocking?token=${token}&minutes=${minutes}`;
    console.log(`Proxying request to: ${apiUrl.replace(token, "REDACTED")}`);

    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upstream API error: ${response.status} ${errorText}`);
    }

    const data = await response.text(); // API returns text or JSON, handle strictly as text/success
    res.json({ success: true, message: data });
  } catch (error) {
    console.error("Error in proxy:", error);
    res
      .status(500)
      .json({ error: "Failed to pause blocking", details: error.message });
  }
});

// Health check proxy endpoint
app.get("/api/health", async (req, res) => {
  const token = process.env.TECHNITIUM_DNS_API_TOKEN;

  if (!process.env.TECHNITIUM_DNS_SERVER_URL) {
    return res
      .status(500)
      .json({ error: "Server configuration error: Missing DNS Server URL" });
  }

  if (!token) {
    return res
      .status(500)
      .json({ error: "Server configuration error: Missing API Token" });
  }

  try {
    const apiUrl = `${process.env.TECHNITIUM_DNS_SERVER_URL}/api/user/checkForUpdate?token=${token}`;
    console.log(
      `Proxying health check to: ${apiUrl.replace(token, "REDACTED")}`,
    );

    const response = await fetch(apiUrl);

    if (!response.ok) {
      // If upstream returns 5xx/4xx, we assume unhealthy
      return res
        .status(response.status)
        .json({ status: "error", upstream_status: response.status });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error in health check proxy:", error);
    res
      .status(500)
      .json({ error: "Failed to check health", details: error.message });
  }
});

// Serve static files from React build
app.use(express.static(path.join(__dirname, "dist")));

// Handle React routing, return all requests to React app
app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
