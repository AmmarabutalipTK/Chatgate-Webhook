"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepzoEvent = void 0;
const prisma_1 = require("../prisma");
const webhook_service_1 = require("../services/webhook.service");
const logger_1 = require("../logger/logger");
const axios_1 = __importDefault(require("axios"));
class RepzoEvent {
    static async handle(payload, deliveryId) {
        const data = payload.data;
        const client = await this.getClient(data.client_id);
        const invoiceId = data.serial_number.formatted;
        const total = this.formatTotal(data);
        const pdfUrl = `${process.env.BASE_URL}/invoice/${invoiceId}.pdf`;
        await prisma_1.prisma.delivery.update({
            where: { id: deliveryId },
            data: {
                clientId: data.client_id,
                clientName: client.name,
                phoneNo: client.phone,
            },
        });
        await logger_1.DeliveryLogger.success(deliveryId, `Customer loaded: ${client.name}`);
        return webhook_service_1.WebhookService.send({
            event: payload.event,
            phone_no: client.phone,
            client_name: client.name,
            total,
            invoiceId,
            pdfUrl,
            event_type: this.getEventType(data.status),
            msg: `${invoiceId} بقيمة ${total} د.ع.`,
        }, deliveryId);
    }
    static async getClient(clientId) {
        const { data } = await axios_1.default.get(`https://sv.api.repzo.me/client/${clientId}`, {
            headers: {
                Authorization: `Bearer ${process.env.REPZO_TOKEN}`,
                "api-key": process.env.REPZO_TOKEN,
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        });
        return data;
    }
    static formatTotal(data) {
        const amount = Number(String(data.total ?? data.amount ?? 0).replace(/,/g, ""));
        return Math.abs(amount / 1000).toLocaleString("en-US");
    }
    static getEventType(status) {
        switch (status) {
            case "consumed":
                return "دفع";
            case "unpaid":
                return "قطع";
            default:
                return "إلغاء";
        }
    }
}
exports.RepzoEvent = RepzoEvent;
