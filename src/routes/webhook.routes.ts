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

  fastify.post(
    "/events/client-created",
    async (request) => {
      await eventBus.dispatch(
        EventType.CLIENT_CREATED,
        request.body
      );

      return {
        success: true,
      };
    }
  );

  fastify.post(
    "/events/client-updated",
    async (request) => {
      await eventBus.dispatch(
        EventType.CLIENT_UPDATED,
        request.body
      );

      return {
        success: true,
      };
    }
  );

  fastify.post(
    "/events/product-created",
    async (request) => {
      await eventBus.dispatch(
        EventType.PRODUCT_CREATED,
        request.body
      );

      return {
        success: true,
      };
    }
  );

  fastify.post(
    "/events/product-updated",
    async (request) => {
      await eventBus.dispatch(
        EventType.PRODUCT_UPDATED,
        request.body
      );

      return {
        success: true,
      };
    }
  );

  fastify.post(
    "/events/salesorder-created",
    async (request) => {
      await eventBus.dispatch(
        EventType.SALESORDER_CREATED,
        request.body
      );

      return {
        success: true,
      };
    }
  );

  fastify.post(
    "/events/salesorder-updated",
    async (request) => {
      await eventBus.dispatch(
        EventType.SALESORDER_UPDATED,
        request.body
      );

      return {
        success: true,
      };
    }
  );

  fastify.post(
    "/events/invoice-created",
    async (request) => {
      await eventBus.dispatch(
        EventType.INVOICE_CREATED,
        request.body
      );

      return {
        success: true,
      };
    }
  );

  fastify.post(
    "/events/inventory-updated",
    async (request) => {
      await eventBus.dispatch(
        EventType.INVENTORY_UPDATED,
        request.body
      );

      return {
        success: true,
      };
    }
  );

  fastify.post(
    "/events/workorder-created",
    async (request) => {
      await eventBus.dispatch(
        EventType.WORKORDER_CREATED,
        request.body
      );

      return {
        success: true,
      };
    }
  );
}