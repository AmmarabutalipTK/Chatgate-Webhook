import { prisma } from "../prisma";
import { WebhookService } from "../services/webhook.service";
import { DeliveryLogger } from "../logger/logger";
import axios from "axios";

export class RepzoEvent {
  static async handle(
    payload: Record<string, any>,
    deliveryId: string
  ) {
    const data = payload.data;

    const client = await this.getClient(data.client_id);

    const invoiceId = data.serial_number.formatted;

    const total = this.formatTotal(data);

    const pdfUrl = `${process.env.BASE_URL}/invoice/${invoiceId}.pdf`;

    await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        clientId: data.client_id,
        clientName: client.name,
        phoneNo: client.phone,
      },
    });

    await DeliveryLogger.success(
      deliveryId,
      `Customer loaded: ${client.name}`
    );

    return WebhookService.send(
      {
        event: payload.event,
        phone_no: client.phone,
        client_name: client.name,
        total,
        invoiceId,
        pdfUrl,
        event_type: this.getEventType(data.status),
        msg: `${invoiceId} بقيمة ${total} د.ع.`,
      },
      deliveryId
    );
  }

  private static async getClient(clientId: string) {
    const { data } = await axios.get(
      `https://sv.api.repzo.me/client/${clientId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.REPZO_TOKEN}`,
          "api-key": process.env.REPZO_TOKEN,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    return data;
  }

  private static formatTotal(data: any): string {
    const amount = Number(
      String(data.total ?? data.amount ?? 0).replace(/,/g, "")
    );

    return Math.abs(amount / 1000).toLocaleString("en-US");
  }

  private static getEventType(status?: string): string {
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