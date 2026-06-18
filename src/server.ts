import Fastify from "fastify";
import { eventRoutes } from "./routes/webhook.routes";
import "dotenv/config";
const app = Fastify({
  logger: true,
});

app.register(eventRoutes);
console.log(process.env.CHATGATE_AUTH);
app.listen({
  port: 4001,
  host: "0.0.0.0",
});