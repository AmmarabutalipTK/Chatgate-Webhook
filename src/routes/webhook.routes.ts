import { FastifyInstance } from "fastify";
import { EventBus } from "../events/event-bus";
import { EventType } from "../events/event-types";
import { prisma } from "../prisma";
import { PdfService } from "../pdf/pdf";

const allowedClients = new Set([
  "6a43c1940d94612bf1b464a6",
  "6527e7b09064a86e075a2661",
  "6395b4027429b1592858f00f",
  '6533789858d41682e6f32536'
  ,"62f91470b27d1993f1a9ea6d",
  "69689c02779aaf242a58a771"
]);

export async function eventRoutes(
  fastify: FastifyInstance
) {
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
    return prisma.delivery.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });
  });

const handleEvent =
  (event: string) =>
  async (request: any, reply: any) => {
    console.log("=========== WEBHOOK RECEIVED ===========");

    const clientId = String(request.body?.client_id ?? "").trim();
    const companyName = String(request.query?.company_name ?? "").trim();

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

    if (!allowedClients.has(clientId)) {
      console.log(`Ignoring webhook from client: ${clientId}`);

      return reply.code(200).send({
        success: true,
        message: "Webhook ignored for this client",
      });
    }

    try {
      await EventBus.dispatch({
        event,
        Channel: "Whatsapp",
        companyName, // <-- pass it here
        data: request.body,
      });

      console.log("Webhook processed successfully");

      return reply.code(200).send({
        success: true,
      });
    } catch (error) {
      console.error("Webhook processing failed");
      console.error(error);

      return reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  fastify.post(
    "/events/client-created",
    handleEvent(EventType.CLIENT_CREATED)
  );

  fastify.post(
    "/events/client-updated",
    handleEvent(EventType.CLIENT_UPDATED)
  );

  fastify.post(
    "/events/product-created",
    handleEvent(EventType.PRODUCT_CREATED)
  );

  fastify.post(
    "/events/product-updated",
    handleEvent(EventType.PRODUCT_UPDATED)
  );

  fastify.post(
    "/events/salesorder-created",
    handleEvent(EventType.SALESORDER_CREATED)
  );

  fastify.post(
    "/events/salesorder-updated",
    handleEvent(EventType.SALESORDER_UPDATED)
  );

  fastify.post(
    "/events/invoice-created",
    handleEvent(EventType.INVOICE_CREATED)
  );

  fastify.post(
    "/events/inventory-updated",
    handleEvent(EventType.INVENTORY_UPDATED)
  );

  fastify.post(
    "/events/workorder-created",
    handleEvent(EventType.WORKORDER_CREATED)
  );

  fastify.get(
    "/invoice/:invoiceId.pdf",
    async (request, reply) => {
      const { invoiceId } = request.params as {
        invoiceId: string;
      };

      return PdfService.download(invoiceId, reply);
    }
  );
}