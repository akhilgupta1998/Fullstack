import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import redis from "./redis.js";
import searchClient from "./search.js";



dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", async (req, res) => {
  try {
    // Check Redis
    await redis.ping();

    // Check Elasticsearch
    await searchClient.ping();

    res.json({
      status: "ok",
      services: {
        redis: "connected",
        elasticsearch: "connected",
      },
    });
  } catch (err) {
    console.error("Health check failed:", err.message);

    res.status(500).json({
      status: "error",
      message: "Service unhealthy",
      error: err.message,
    });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
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
  
      // 2. Search Elasticsearch
      const result = await searchClient.search({
        index: "items",
        query: {
          match: {
            name: query,
          },
        },
      });
  
      const hits = result.hits.hits.map((hit) => hit._source);
  
      // 3. Store in Redis (60 seconds)
      await redis.set(query, JSON.stringify(hits), "EX", 60);
  
      res.json({
        source: "elasticsearch",
        data: hits,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Search failed" });
    }
  });
  app.get("/seed", async (req, res) => {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        error: "Seed endpoint disabled in production",
      });
    }
  
    try {
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
      console.error(err);
      res.status(500).json({ error: "Seeding failed" });
    }
  });
  