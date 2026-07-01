import axios from "axios";
import { prisma } from "../prisma";
import { DeliveryLogger } from "../logger/logger";

export class WebhookService {
  static async send(
    payload: Record<string, any>,
    deliveryId: string
  ) {
    const event = String(payload.event);
    const name = String(payload.client_name ?? "");
    const total = String(payload.total ?? "");
    const pdfUrl = String(payload.pdfUrl ?? "");
    const event_type = String(payload.event_type ?? "");
    const msg = String(payload.msg ?? "");
    const invoiceId = String(payload.invoiceId ?? "");

    const phone_no = String(payload?.phone_no ?? "")

    const body: Record<string, any> = {
  "event": "invoice.created",
  "user.channel": "whatsapp",
  "user.phone_no": "966551753513",
  "sum": "142,200",
  "msg": "INV-1020-306 بقيمة 142,200 د.ع.",
  "name5": "عبدالرزاق",
  "event_type": "قطع",
  "pdfUrl": "https://webhooks.chatgate.takarubdev.com/invoice/INV-1020-306.pdf",
  "invoiceId": "INV-1020-306"
}


    // if (pdfUrl) {
    //   body.pdfUrl = pdfUrl;
    // }

    const url =
      "https://api.chatgate.io/bot-api/v2.0/customer/125419/bot/899870cca0c847b4/flow/6A279921EE5B46779084F487191483C5";

    await DeliveryLogger.info(
      deliveryId,
      "Sending request to ChatGate"
    );

    try {
      const response = await axios.post(url, body, {
        headers: {
          Authorization: `Basic ${process.env.CHATGATE_AUTH}`,
          "Content-Type": "application/json",
        },
      });

      await DeliveryLogger.success(
        deliveryId,
        `ChatGate responded with ${response.status}`
      );

      await prisma.delivery.update({
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

      await DeliveryLogger.success(
        deliveryId,
        "Webhook completed successfully"
      );

      return response.data;
    } catch (error: any) {
      const statusCode = error.response?.status ?? 500;

      const responseBody =
        typeof error.response?.data === "string"
          ? error.response.data
          : JSON.stringify(
              error.response?.data ?? {
                message: error.message,
              }
            );

      await DeliveryLogger.error(
        deliveryId,
        `ChatGate failed (${statusCode})`
      );

      await DeliveryLogger.error(
        deliveryId,
        responseBody
      );

      await prisma.delivery.update({
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