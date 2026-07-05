"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const webhook_routes_1 = require("./routes/webhook.routes");
require("dotenv/config");
const app = (0, fastify_1.default)({
    logger: true,
});
app.register(webhook_routes_1.eventRoutes);
app.ready().then(() => {
    console.log(app.printRoutes());
});
app.listen({
    port: 4001,
    host: "0.0.0.0",
});
