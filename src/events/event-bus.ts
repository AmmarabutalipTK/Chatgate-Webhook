import { WebhookService } from "../services/webhook.service";
import { prisma } from "../prisma";
import axios from "axios";
import { DeliveryLogger } from "../logger/logger";

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

  static async dispatch(payload: Record<string, any>) {
    const data = payload?.data;
    const clientId = data?.client_id;
    const repzoInvoiceId = data?._id;
const total = (
  Number(String(data.total).replace(/,/g, "")) / 1000
).toLocaleString("en-US");
// "391,000"
    // Create delivery FIRST
    const delivery = await prisma.delivery.create({
      data: {
        event: payload.event,
        invoiceId: data.serial_number?.formatted,
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

    await DeliveryLogger.info(
      delivery.id,
      "Checking for duplicate invoice"
    );

    // const alreadySent = await prisma.delivery.findFirst({
    //   where: {
    //     id: {
    //       not: delivery.id,
    //     },
    //     event: payload.event,
    //     success: true,
    //     invoiceId: repzoInvoiceId,
    //   },
    // });

    // if (alreadySent) {
    //   await DeliveryLogger.warning(
    //     delivery.id,
    //     `Duplicate invoice ${repzoInvoiceId} detected`
    //   );

      // await prisma.delivery.update({
      //   where: {
      //     id: delivery.id,
      //   },
      //   data: {
      //     success: false,
      //     statusCode: 409,
      //     responseBody: "Duplicate invoice",
      //   },
      // });

    //   return;
    // }

    if (clientId && +data?.total>0) {
      await DeliveryLogger.info(
        delivery.id,
        `Fetching Repzo customer ${clientId}`
      );

      const client = await EventBus.getClient(clientId);

      await DeliveryLogger.success(
        delivery.id,
        `Customer loaded: ${client.name}`
      );

      const clientPhone = client.phone;
      const clientName = client.name;

      const msg = `مرحبا ${clientName} طلبك جاهز`;
const pdfUrl = `${process.env.BASE_URL}/invoice/${repzoInvoiceId}/download`;
await prisma.delivery.update({
  where: {
    id: delivery.id,
  },
  data: {
    clientId,
    clientName,
    phoneNo: clientPhone,
  },
});
      return WebhookService.send(
        {
          event: payload.event,
          user: {
            phone_no: clientPhone,
          },
          phone_no: clientPhone,
          client_name: clientName,
          total,
          invoiceId: repzoInvoiceId,
          msg,
          pdfUrl
          
        },
        delivery.id
      );
    }

    return WebhookService.send(payload, delivery.id);
  }
}