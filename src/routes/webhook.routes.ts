import { FastifyInstance } from "fastify";
import { eventBus } from "../events/event-bus";
import { EventType } from "../events/event-types";
import { prisma } from "../prisma";

export async function eventRoutes(
  fastify: FastifyInstance
) {
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
    async (request: any) => {
      const query = request.query as {
        phone_no?: string;
        Channel?: string;
      };

      await eventBus.dispatch({
        event,
        phone_no: query.phone_no,
        Channel:
          query.Channel ?? "Whatsapp",
        data: request.body,
      });

      return {
        success: true,
      };
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
    handleEvent(
      EventType.SALESORDER_CREATED
    )
  );

  fastify.post(
    "/events/salesorder-updated",
    handleEvent(
      EventType.SALESORDER_UPDATED
    )
  );

  fastify.post(
    "/events/invoice-created",
    handleEvent(
      EventType.INVOICE_CREATED
    )
  );

  fastify.post(
    "/events/inventory-updated",
    handleEvent(
      EventType.INVENTORY_UPDATED
    )
  );

  fastify.post(
    "/events/workorder-created",
    handleEvent(
      EventType.WORKORDER_CREATED
    )
  );
}