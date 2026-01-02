import { Client } from "@elastic/elasticsearch";

let client = null;

export function getSearchClient() {
  if (!process.env.ELASTICSEARCH_URL) {
    throw new Error("ELASTICSEARCH_URL not configured");
  }

  if (!client) {
    client = new Client({
      node: process.env.ELASTICSEARCH_URL,
    });
  }

  return client;
}
