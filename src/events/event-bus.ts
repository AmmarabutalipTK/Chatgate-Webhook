import { WebhookService } from "../services/webhook.service";
import { prisma } from "../prisma";
import axios from "axios";

export class EventBus {
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

  async dispatch(payload: Record<string, any>) {
    const clientId = payload?.data?.client_id;
    const data = payload?.data;

    // Real invoice id for deduplication
    const repzoInvoiceId = data?._id;

    // Keep your existing invoice id
    const invoiceId = data?.creator?._id?.slice(-6);

    if (repzoInvoiceId) {
      const alreadySent = await prisma.delivery.findFirst({
        where: {
          event: payload.event,
          success: true,
          requestBody: {
            contains: repzoInvoiceId,
          },
        },
      });

      if (alreadySent) {
        console.log(
          `Skipping duplicate invoice ${repzoInvoiceId}`
        );
        return;
      }
    }

    if (clientId) {
      const client = await EventBus.getClient(clientId);

      const clientPhone = client?.phone;
      const clientName = client?.name;
      const total = data?.total;

      const invoiceId=data?._id
      const msg = `مرحبا ${clientName} طلبك جاهز`;

      return WebhookService.send({

        event: payload.event,
        user: {
          phone_no: clientPhone,
        },
        phone_no: clientPhone,
        msg,
        client_name: clientName,
        total,
        invoiceId, 
      });
    }

    return WebhookService.send(payload);
  }
}

export const eventBus = new EventBus();