export const config = {
  port: Number(process.env.PORT ?? 3000),
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  temporalAddress: process.env.TEMPORAL_ADDRESS ?? "localhost:7233",
  temporalNamespace: process.env.TEMPORAL_NAMESPACE ?? "default",
  temporalTaskQueue: process.env.TEMPORAL_TASK_QUEUE ?? "hotel-offers",
  supplierBaseUrl: process.env.SUPPLIER_BASE_URL ?? "http://localhost:3000"
};
