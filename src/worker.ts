import { NativeConnection, Worker } from "@temporalio/worker";
import { config } from "./config";
import * as activities from "./activities";
import { logger } from "./logger";

async function main(): Promise<void> {
  const connection = await NativeConnection.connect({ address: config.temporalAddress });
  const worker = await Worker.create({
    connection,
    namespace: config.temporalNamespace,
    taskQueue: config.temporalTaskQueue,
    workflowsPath: require.resolve("./workflows"),
    activities
  });

  logger.info(
    { temporalAddress: config.temporalAddress, taskQueue: config.temporalTaskQueue },
    "Temporal worker started"
  );

  await worker.run();
}

main().catch((error) => {
  logger.error({ error }, "Temporal worker failed");
  process.exit(1);
});
