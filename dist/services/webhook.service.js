"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookService = void 0;
const axios_1 = __importDefault(require("axios"));
const prisma_1 = require("../prisma");
const logger_1 = require("../logger/logger");
class WebhookService {
    static async send(payload, deliveryId) {
        const event = String(payload.event);
        const name = String(payload.client_name ?? "");
        const total = String(payload.total ?? "");
        const pdfUrl = String(payload.pdfUrl ?? "");
        const event_type = String(payload.event_type ?? "");
        const msg = String(payload.msg ?? "");
        const invoiceId = String(payload.invoiceId ?? "");
        const companyName = String(payload.companyName ?? "");
        const phone_no = String(payload?.phone_no ?? "").replace(/^\+/, "");
        const body = {
            event,
            "user.channel": "whatsapp",
            "user.phone_no": phone_no,
            sum: total,
            msg,
            name5: name,
            event_type,
            pdfUrl,
            invoiceId,
            companyName
        };
        // if (pdfUrl) {
        //   body.pdfUrl = pdfUrl;
        // }
        const url = "https://api.chatgate.io/bot-api/v2.0/customer/125419/bot/899870cca0c847b4/flow/6A279921EE5B46779084F487191483C5";
        await logger_1.DeliveryLogger.info(deliveryId, "Sending request to ChatGate");
        try {
            const response = await axios_1.default.post(url, body, {
                headers: {
                    Authorization: `Basic ${process.env.CHATGATE_AUTH}`,
                    "Content-Type": "application/json",
                },
            });
            await logger_1.DeliveryLogger.success(deliveryId, `ChatGate responded with ${response.status}`);
            await prisma_1.prisma.delivery.update({
                where: {
                    id: deliveryId,
                },
                data: {
                    phoneNo: phone_no,
                    success: true,
                    statusCode: response.status,
                    responseBody: JSON.stringify(response.data),
                },
            });
            await logger_1.DeliveryLogger.success(deliveryId, "Webhook completed successfully");
            return response.data;
        }
        catch (error) {
            const statusCode = error.response?.status ?? 500;
            const responseBody = typeof error.response?.data === "string"
                ? error.response.data
                : JSON.stringify(error.response?.data ?? {
                    message: error.message,
                });
            await logger_1.DeliveryLogger.error(deliveryId, `ChatGate failed (${statusCode})`);
            await logger_1.DeliveryLogger.error(deliveryId, responseBody);
            await prisma_1.prisma.delivery.update({
                where: {
                    id: deliveryId,
                },
                data: {
                    phoneNo: phone_no,
                    success: false,
                    statusCode,
                    responseBody,
                },
            });
            throw error;
        }
    }
}
exports.WebhookService = WebhookService;
