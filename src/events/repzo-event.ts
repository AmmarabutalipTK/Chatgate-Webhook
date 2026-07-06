import { prisma } from "../prisma";
import { WebhookService } from "../services/webhook.service";
import { DeliveryLogger } from "../logger/logger";
import axios from "axios";


const REPZO_CONFIG: Record<string, { token: string }> = {
  fusteka: {
    token: process.env.REPZO_FUSTEKA_TOKEN!,
  },
  fustekacream: {
    token: process.env.REPZO_FUSTEKACREAM_TOKEN!,
  },
  frenchfries: {
    token: process.env.REPZO_FRENCHFRIES_TOKEN!,
  },
  fustekaola: {
    token: process.env.REPZO_FUSTEKAOLA_TOKEN!,
  },
  rasan: {
    token: process.env.REPZO_RASAN_TOKEN!,
  },
};

export class RepzoEvent {
  static async handle(
    payload: Record<string, any>,
    deliveryId: string
  ) {
    const companyName = payload.companyName;

    const data = payload.data;

    const config = REPZO_CONFIG[companyName];


const token = config.token;

    const client = await this.getClient(data.client_id, token ?? process.env.REPZO_TOKEN!);

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
        companyName,
        msg: `${invoiceId} بقيمة ${total} د.ع.`,
      },
      deliveryId
    );
  }

  

  private static async getClient(clientId: string,token:string) {
    const { data } = await axios.get(
      `https://sv.api.repzo.me/client/${clientId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "api-key":token,
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