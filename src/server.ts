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
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hotel Offer Orchestrator</title>
<style>
:root{font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#172033;background:#f5f7fb}
*{box-sizing:border-box}body{margin:0}.wrap{max-width:1180px;margin:auto;padding:28px 18px 60px}
.hero{background:linear-gradient(135deg,#172033,#334e9b);color:#fff;border-radius:24px;padding:38px 30px;box-shadow:0 18px 50px rgba(23,32,51,.18)}
.badge{display:inline-flex;padding:7px 12px;border-radius:999px;background:rgba(255,255,255,.13);font-size:13px}
h1{font-size:clamp(32px,6vw,58px);line-height:1.02;margin:16px 0 12px}.hero p{max-width:720px;color:#dbe4ff;font-size:17px;line-height:1.6}
.stack{display:flex;flex-wrap:wrap;gap:8px;margin-top:20px}.stack span{background:#fff;color:#172033;padding:7px 11px;border-radius:9px;font-size:13px;font-weight:600}
.panel{background:#fff;border:1px solid #e5e9f2;border-radius:18px;padding:22px;margin-top:20px;box-shadow:0 8px 28px rgba(23,32,51,.06)}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.stat{padding:16px;background:#f8f9fc;border-radius:14px}.stat b{display:block;font-size:22px;margin-top:4px}.muted{color:#68738a;font-size:13px}
.controls{display:grid;grid-template-columns:1.5fr 1fr 1fr auto;gap:10px;margin-top:16px}input,select,button{width:100%;padding:12px 13px;border-radius:10px;border:1px solid #d7ddea;font:inherit}button{background:#3157d5;color:#fff;border:0;font-weight:700;cursor:pointer}button.secondary{background:#eef2ff;color:#3157d5}.results{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:18px}.card{border:1px solid #e5e9f2;border-radius:15px;padding:17px;background:#fff}.price{font-size:25px;font-weight:800}.supplier{display:inline-block;margin-top:9px;padding:5px 8px;border-radius:7px;background:#eef2ff;color:#3157d5;font-size:12px;font-weight:700}
.health{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.health div{padding:13px;border-radius:11px;background:#f8f9fc}.up{color:#14804a;font-weight:700}.down{color:#c0392b;font-weight:700}
.endpoint{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:#f3f5f9;padding:4px 7px;border-radius:6px}
footer{margin-top:24px;color:#68738a;font-size:13px;text-align:center}
@media(max-width:800px){.grid,.health{grid-template-columns:repeat(2,1fr)}.results{grid-template-columns:1fr 1fr}.controls{grid-template-columns:1fr 1fr}.controls button{grid-column:1/-1}}
@media(max-width:520px){.results{grid-template-columns:1fr}.controls{grid-template-columns:1fr}.hero{padding:28px 22px}.grid,.health{grid-template-columns:1fr 1fr}}
</style>
</head>
<body><main class="wrap">
<section class="hero">
<span class="badge">Backend Assessment • Live Deployment</span>
<h1>Hotel Offer<br>Orchestrator</h1>
<p>Compare two supplier inventories, deduplicate hotels by name, select the lowest available price, persist the result in Redis, and query offers by price range.</p>
<div class="stack"><span>Node.js</span><span>TypeScript</span><span>Express</span><span>Temporal</span><span>Redis</span><span>Docker</span></div>
</section>

<section class="panel">
<h2>Live Hotel Search</h2>
<div class="muted">This UI calls the deployed API and triggers the Temporal workflow.</div>
<div class="controls">
<input id="city" value="delhi" placeholder="City e.g. delhi">
<input id="min" type="number" placeholder="Min price">
<input id="max" type="number" placeholder="Max price">
<button onclick="searchHotels()">Search Offers</button>
</div>
<div id="message" class="muted" style="margin-top:12px"></div>
<div id="results" class="results"></div>
</section>

<section class="panel">
<h2>System Health</h2>
<div id="health" class="health"><div>Checking...</div></div>
</section>

<section class="panel">
<h2>Architecture & API</h2>
<div class="grid">
<div class="stat"><span class="muted">Orchestration</span><b>Temporal</b><span class="muted">Parallel supplier activities</span></div>
<div class="stat"><span class="muted">Persistence</span><b>Redis</b><span class="muted">Sorted-set price index</span></div>
<div class="stat"><span class="muted">Suppliers</span><b>2 Mock APIs</b><span class="muted">Overlapping inventories</span></div>
<div class="stat"><span class="muted">Delivery</span><b>Docker</b><span class="muted">Railway deployment</span></div>
</div>
<p><span class="endpoint">GET /api/hotels?city=delhi</span></p>
<p><span class="endpoint">GET /api/hotels?city=delhi&minPrice=4000&maxPrice=6000</span></p>
<p><span class="endpoint">GET /supplierA/hotels?city=delhi</span></p>
<p><span class="endpoint">GET /supplierB/hotels?city=delhi</span></p>
<p><span class="endpoint">GET /health</span></p>
</section>

<footer>Hotel Offer Orchestrator • Temporal-powered hotel offer aggregation API</footer>
</main>
<script>
const money=n=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);
async function searchHotels(){
 const city=document.getElementById("city").value.trim();
 const min=document.getElementById("min").value;
 const max=document.getElementById("max").value;
 const msg=document.getElementById("message"), out=document.getElementById("results");
 if(!city){msg.textContent="Please enter a city.";return}
 msg.textContent="Running Temporal workflow and fetching offers...";
 out.innerHTML="";
 const q=new URLSearchParams({city});
 if(min)q.set("minPrice",min);if(max)q.set("maxPrice",max);
 try{
  const r=await fetch("/api/hotels?"+q.toString());const data=await r.json();
  if(!r.ok)throw new Error(data.message||data.error||"Request failed");
  msg.textContent=data.length+" offer(s) returned";
  out.innerHTML=data.length?data.map(x=>`<article class="card"><div class="muted">Hotel</div><h3>${x.name}</h3><div class="price">${money(x.price)}</div><span class="supplier">${x.supplier}</span><div class="muted" style="margin-top:10px">Commission: ${x.commissionPct}%</div></article>`).join(""):"<div class='muted'>No hotels found for this city/price range.</div>";
 }catch(e){msg.textContent="Error: "+e.message}
}
async function loadHealth(){
 const el=document.getElementById("health");
 try{
  const r=await fetch("/health");const h=await r.json();
  el.innerHTML=[["Overall",h.status],["Redis",h.redis],["Supplier A",h.suppliers?.supplierA],["Supplier B",h.suppliers?.supplierB]].map(([n,v])=>`<div><span class="muted">${n}</span><br><span class="${v==="up"||v==="ok"?"up":"down"}">${v||"unknown"}</span></div>`).join("");
 }catch(e){el.innerHTML="<div class='down'>Health check unavailable</div>"}
}
loadHealth();searchHotels();
</script>
</body></html>`);
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
