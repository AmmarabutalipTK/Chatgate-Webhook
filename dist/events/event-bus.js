"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBus = void 0;
const logger_1 = require("../logger/logger");
const prisma_1 = require("../prisma");
const webhook_service_1 = require("../services/webhook.service");
const repzo_event_1 = require("./repzo-event");
class EventBus {
    static async dispatch(payload) {
        const delivery = await prisma_1.prisma.delivery.create({
            data: {
                companyName: payload.companyName,
                event: payload.event,
                invoiceId: payload.data?.serial_number?.formatted,
                requestBody: JSON.stringify(payload),
                responseBody: "",
                statusCode: 0,
                success: false,
            },
        });
        await logger_1.DeliveryLogger.info(delivery.id, "Webhook received from Repzo");
        if (!payload.data?.client_id) {
            return webhook_service_1.WebhookService.send(payload, delivery.id);
        }
        return repzo_event_1.RepzoEvent.handle(payload, delivery.id);
    }
}
exports.EventBus = EventBus;
