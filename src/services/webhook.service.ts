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
    const total = Number(payload.total ?? 0);
    const invoiceId = String(payload.invoiceId ?? "");

    const phone_no = String(payload?.user?.phone_no ?? "")
      .replace(/^\+/, "")
      .replace(/\s+/g, "");

    const params = new URLSearchParams();

    params.append("event", event);
    params.append("user.phone_no", phone_no);
    params.append("channel", "Whatsapp");
    params.append("name", name);
    params.append("total", total.toFixed(3));
    params.append("invoiceId", invoiceId);

    if (payload.msg) {
      params.append("msg", String(payload.msg));
    }

    const baseUrl =
      "https://api.chatgate.io/bot-api/v1.0/customer/125419/bot/899870cca0c847b4/flow/6A279921EE5B46779084F487191483C5";


      
    const url = `${baseUrl}?${params.toString()}`;

    console.log({url})

    await DeliveryLogger.info(
      deliveryId,
      "Sending request to ChatGate"
    );

    try {
      const response = await axios.post(url, payload, {
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