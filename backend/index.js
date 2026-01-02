import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import redis from "./redis.js";
import { getSearchClient } from "./search.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/**
 * Health check
 * - Must NEVER crash the app
 * - Used by ECS + ALB
 */
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

  // Redis check (non-fatal)
  try {
    await redis.ping();
    services.redis = "connected";
  } catch (err) {
    services.redis = "unavailable";
  }

  // Elasticsearch check (non-fatal, lazy)
  try {
    const searchClient = getSearchClient();
    await searchClient.ping();
    services.elasticsearch = "connected";
  } catch (err) {
    services.elasticsearch = "unavailable";
  }

  res.json({
    status: "ok",
    services,
  });
});

/**
 * Search API
 */
app.get("/search", async (req, res) => {
  try {
    const query = req.query.q;

    if (!query) {
      return res.status(400).json({ error: "Missing query param q" });
    }

    // 1. Check Redis cache
    const cached = await redis.get(query);
    if (cached) {
      return res.json({
        source: "cache",
        data: JSON.parse(cached),
      });
    }

    // 2. Lazy Elasticsearch client
    const searchClient = getSearchClient();

    const result = await searchClient.search({
      index: "items",
      query: {
        match: {
          name: query,
        },
      },
    });

    const hits = result.hits.hits.map((hit) => hit._source);

    // 3. Cache results
    await redis.set(query, JSON.stringify(hits), "EX", 60);

    res.json({
      source: "elasticsearch",
      data: hits,
    });
  } catch (err) {
    console.error("Search error:", err.message);
    res.status(500).json({ error: "Search failed" });
  }
});

/**
 * Seed API (disabled in production)
 */
app.get("/seed", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({
      error: "Seed endpoint disabled in production",
    });
  }

  try {
    const searchClient = getSearchClient();

    const items = [
      { name: "iPhone 14", category: "phone" },
      { name: "iPhone 15 Pro", category: "phone" },
      { name: "Samsung Galaxy S23", category: "phone" },
      { name: "MacBook Air M2", category: "laptop" },
      { name: "MacBook Pro M3", category: "laptop" },
    ];

    for (const item of items) {
      await searchClient.index({
        index: "items",
        document: item,
      });
    }

    res.json({ message: "Data seeded successfully" });
  } catch (err) {
    console.error("Seeding error:", err.message);
    res.status(500).json({ error: "Seeding failed" });
  }
});

/**
 * App start
 */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
