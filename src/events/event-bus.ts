import { WebhookService } from "../services/webhook.service";
import { EventType } from "./event-types";
import axios from "axios";

export class EventBus {

private static async getClient(clientId: string) {
  try {
    const data = await axios.get(
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

    console.dir(data, { depth: null });

    return data?.data;
  } catch (error: any) {
    console.error("Status:", error.response?.status);
    console.error("Headers:", error.response?.headers);
    console.error("Body:", error.response?.data);

    throw error;
  }
}

async dispatch(payload: Record<string, any>) {
     const clientId = payload?.data?.client_id;

      if (true) {
        const client = await EventBus.getClient(clientId);
     const clientPhone = client?.phone
     const clineName = client?.name

     console.log({client})

        const msg = `مرحبا ${clineName} طلبك جاهز` 
        return WebhookService.send({
          ...payload,
          user: {
            phone_no: clientPhone,
          },
          phone_no:clientPhone,
          msg,
          client_name: clineName,
        });
      }
  // switch (payload.event) {
  //   case EventType.INVOICE_CREATED: {
  //     const clientId = payload?.data?.client_id;

  //     if (clientId) {
  //       const client = await EventBus.getClient(clientId);

  //       return WebhookService.send({
  //         ...payload,
  //         user: {
  //           phone_no: client?.phone,
  //         },
  //         client_name: client?.name,
  //       });
  //     }

  //     // break;
  //   }

  //   default:
  //     break;
  // }

  return WebhookService.send(payload);
}
}

export const eventBus = new EventBus();