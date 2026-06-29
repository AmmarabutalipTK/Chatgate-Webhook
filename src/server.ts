import Fastify from "fastify";
import { eventRoutes } from "./routes/webhook.routes";
import "dotenv/config";
const app = Fastify({
  logger: true,
});

app.register(eventRoutes);
app.listen({
  port: 4001,
  host: "0.0.0.0",
});