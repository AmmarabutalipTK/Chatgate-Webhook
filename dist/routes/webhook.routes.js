"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventRoutes = eventRoutes;
const event_bus_1 = require("../events/event-bus");
const event_types_1 = require("../events/event-types");
const prisma_1 = require("../prisma");
const pdf_1 = require("../pdf/pdf");
const allowedClients = new Set([
    "6a43c1940d94612bf1b464a6",
    "6527e7b09064a86e075a2661",
    "6395b4027429b1592858f00f",
    '6533789858d41682e6f32536',
    "62f91470b27d1993f1a9ea6d",
    "69689c02779aaf242a58a771"
]);
async function eventRoutes(fastify) {
    // Log every incoming request
    fastify.addHook("onRequest", async (request) => {
        console.log("========================================");
        console.log("Incoming Request");
        console.log({
            time: new Date().toISOString(),
            method: request.method,
            url: request.url,
            ip: request.ip,
            headers: request.headers,
        });
        console.log("========================================");
    });
    fastify.get("/health", async () => {
        return {
            success: true,
        };
    });
    fastify.get("/deliveries", async () => {
        return prisma_1.prisma.delivery.findMany({
            orderBy: {
                createdAt: "desc",
            },
            take: 100,
        });
    });
    const handleEvent = (event) => async (request, reply) => {
        console.log("=========== WEBHOOK RECEIVED ===========");
        const clientId = String(request.body?.client_id ?? "").trim();
        const companyName = String(request.query?.company_name ?? "").trim();
        console.log(`companyName ${companyName}`);
        console.log({
            time: new Date().toISOString(),
            event,
            invoiceId: request.body?._id,
            clientId,
            companyName,
            allowed: allowedClients.has(clientId),
        });
        console.log("Body:");
        console.log(JSON.stringify(request.body, null, 2));
        // if (!allowedClients.has(clientId)) {
        //     console.log(`Ignoring webhook from client: ${clientId} company ${companyName}`);
        //     return reply.code(200).send({
        //         success: true,
        //         message: "dd ignored for this client" + companyName,
        //     });
        // }
        try {
            await event_bus_1.EventBus.dispatch({
                event,
                Channel: "Whatsapp",
                companyName, // <-- pass it here
                data: request.body,
            });
            console.log("Webhook processed successfully");
            return reply.code(200).send({
                success: true,
            });
        }
        catch (error) {
            console.error("Webhook processing failed");
            console.error(error);
            return reply.code(500).send({
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    };
    fastify.post("/events/client-created", handleEvent(event_types_1.EventType.CLIENT_CREATED));
    fastify.post("/events/client-updated", handleEvent(event_types_1.EventType.CLIENT_UPDATED));
    fastify.post("/events/product-created", handleEvent(event_types_1.EventType.PRODUCT_CREATED));
    fastify.post("/events/product-updated", handleEvent(event_types_1.EventType.PRODUCT_UPDATED));
    fastify.post("/events/salesorder-created", handleEvent(event_types_1.EventType.SALESORDER_CREATED));
    fastify.post("/events/salesorder-updated", handleEvent(event_types_1.EventType.SALESORDER_UPDATED));
    fastify.post("/events/invoice-created", handleEvent(event_types_1.EventType.INVOICE_CREATED));
    fastify.post("/events/inventory-updated", handleEvent(event_types_1.EventType.INVENTORY_UPDATED));
    fastify.post("/events/workorder-created", handleEvent(event_types_1.EventType.WORKORDER_CREATED));
    fastify.get("/invoice/:invoiceId.pdf", async (request, reply) => {
        const { invoiceId } = request.params;
        return pdf_1.PdfService.download(invoiceId, reply);
    });
}
