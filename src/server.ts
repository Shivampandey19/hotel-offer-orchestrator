import express, { Request, Response } from "express";
import { Client, Connection } from "@temporalio/client";
import pinoHttp from "pino-http";
import { config } from "./config";
import { logger } from "./logger";
import { getOffersByPrice, redis } from "./redis";
import { getSupplierHotels } from "./suppliers";
import { hotelOfferWorkflow } from "./workflows";

const app = express();
app.use(express.json());
app.use(pinoHttp({ logger }));

let temporalClient: Client | undefined;

async function getTemporalClient(): Promise<Client> {
  if (temporalClient) return temporalClient;
  const connection = await Connection.connect({ address: config.temporalAddress });
  temporalClient = new Client({ connection, namespace: config.temporalNamespace });
  return temporalClient;
}

app.get("/", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hotel Offer Orchestrator</title>
<style>body{font-family:system-ui,sans-serif;max-width:760px;margin:60px auto;padding:24px;line-height:1.6}code{background:#f2f2f2;padding:3px 6px;border-radius:5px}</style>
</head><body><h1>Hotel Offer Orchestrator</h1>
<p>Temporal-powered hotel offer aggregation API.</p>
<h2>Endpoints</h2><ul>
<li><code>GET /health</code> — service health</li>
<li><code>GET /api/hotels?city=delhi</code> — aggregated offers</li>
<li><code>GET /api/hotels?city=delhi&minPrice=4000&maxPrice=6000</code> — filtered offers</li>
</ul><p>Backend assessment deployment.</p></body></html>`);
});

app.get("/health", (_req, res) => {
  // Keep the Railway liveness probe fast and independent of downstream services.
  // Dependency checks are intentionally handled by application requests.
  return res.status(200).json({
    status: "ok",
    service: "hotel-offer-orchestrator"
  });
});
app.get("/supplierA/hotels", (req, res) => {
  const city = String(req.query.city ?? "").trim();
  if (!city) return res.status(400).json({ error: "city is required" });
  return res.json(getSupplierHotels("Supplier A", city));
});

app.get("/supplierB/hotels", (req, res) => {
  const city = String(req.query.city ?? "").trim();
  if (!city) return res.status(400).json({ error: "city is required" });
  return res.json(getSupplierHotels("Supplier B", city));
});

app.get("/api/hotels", async (req: Request, res: Response) => {
  const city = String(req.query.city ?? "").trim().toLowerCase();
  if (!city) return res.status(400).json({ error: "city query parameter is required" });

  const minRaw = req.query.minPrice;
  const maxRaw = req.query.maxPrice;
  const minPrice = minRaw === undefined ? undefined : Number(minRaw);
  const maxPrice = maxRaw === undefined ? undefined : Number(maxRaw);

  if (
    (minPrice !== undefined && !Number.isFinite(minPrice)) ||
    (maxPrice !== undefined && !Number.isFinite(maxPrice))
  ) {
    return res.status(400).json({ error: "minPrice and maxPrice must be valid numbers" });
  }

  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    return res.status(400).json({ error: "minPrice cannot be greater than maxPrice" });
  }

  try {
    const client = await getTemporalClient();
    const handle = await client.workflow.start(hotelOfferWorkflow, {
      taskQueue: config.temporalTaskQueue,
      workflowId: `hotel-offers-${city}-${Date.now()}`,
      args: [city]
    });

    await handle.result();

    const offers = await getOffersByPrice(
      city,
      minPrice ?? 0,
      maxPrice ?? Number.POSITIVE_INFINITY
    );

    return res.json(offers);
  } catch (error) {
    req.log.error({ error, city }, "Hotel aggregation failed");
    return res.status(502).json({
      error: "Unable to aggregate hotel offers",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

const server = app.listen(config.port, () => {
  logger.info({ port: config.port }, "HTTP server started");
});

async function shutdown(): Promise<void> {
  server.close();
  await redis.quit();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
