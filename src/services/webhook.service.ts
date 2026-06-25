import axios from "axios";
import { prisma } from "../prisma";

export class WebhookService {
  static async send(payload: Record<string, any>) {
    const event = String(payload.event);
    const name = String(payload.client_name ?? "");
    const total = Number(payload.total ?? 0);
    const invoiceId = String(payload.invoiceId ?? "");

    // normalize phone safely
    const phone_no = String(payload?.user?.phone_no ?? "")
      .replace(/^\+/, "")
      .replace(/\s+/g, "");

    // ===============================
    // 1. IDENTITY / IDEMPOTENCY GUARD
    // ===============================
    const existing = await prisma.delivery.findFirst({
      where: {
        event,
        requestBody: {
          contains: invoiceId,
        },
      },
    });

    if (existing) {
      console.log(`[Webhook] Duplicate skipped for invoice: ${invoiceId}`);
      return;
    }

    // ===============================
    // 2. BUILD QUERY PARAMS (SAFE)
    // ===============================
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

    // ===============================
    // 3. CHATGATE URL
    // ===============================
    const baseUrl =
      "https://api.chatgate.io/bot-api/v1.0/customer/125419/bot/899870cca0c847b4/flow/6A279921EE5B46779084F487191483C5";

    const url = `${baseUrl}?${params.toString()}`;

    try {
      console.log("[Webhook] Sending to ChatGate:", url);

      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Basic ${process.env.CHATGATE_AUTH}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      });

      // ===============================
      // 4. SUCCESS LOG
      // ===============================
      await prisma.delivery.create({
        data: {
          event,
          requestBody: JSON.stringify(payload),
          statusCode: response.status,
          success: true,
          responseBody: JSON.stringify(response.data),
        },
      });

      console.log("[Webhook] Success:", invoiceId);
    } catch (error: any) {
      const statusCode = error.response?.status ?? 500;

      const responseBody =
        typeof error.response?.data === "string"
          ? error.response.data
          : JSON.stringify(error.response?.data ?? { message: error.message });

      // ===============================
      // 5. ERROR LOG
      // ===============================
      await prisma.delivery.create({
        data: {
          event,
          requestBody: JSON.stringify(payload),
          statusCode,
          success: false,
          responseBody,
        },
      });

      console.error("[Webhook] Failed:", invoiceId, responseBody);

      throw error;
    }
  }
}