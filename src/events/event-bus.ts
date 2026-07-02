import { DeliveryLogger } from "../logger/logger";
import { prisma } from "../prisma";
import { WebhookService } from "../services/webhook.service";
import { RepzoEvent } from "./repzo-event";

export class EventBus {
  static async dispatch(payload: Record<string, any>) {
    const delivery = await prisma.delivery.create({
      data: {
        event: payload.event,
        invoiceId: payload.data?.serial_number?.formatted,
        requestBody: JSON.stringify(payload),
        responseBody: "",
        statusCode: 0,
        success: false,
      },
    });

    await DeliveryLogger.info(
      delivery.id,
      "Webhook received from Repzo"
    );

    if (!payload.data?.client_id) {
      return WebhookService.send(payload, delivery.id);
    }

    return RepzoEvent.handle(payload, delivery.id);
  }
}