import { WebhookService } from "../services/webhook.service";
import { EventType } from "./event-types";

export class EventBus {
  private static async getClient(clientId: string) {
    const response = await fetch(
      `https://sv.api.repzo.me/client/${clientId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.REPZO_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch client ${clientId}: ${response.status}`
      );
    }

    return response.json();
  }

async dispatch(payload: Record<string, any>) {
     const clientId = payload?.data?.client_id;

      if (clientId) {
        const client = await EventBus.getClient(clientId);

        return WebhookService.send({
          ...payload,
          user: {
            phone_no: client?.phone,
          },
          client_name: client?.name,
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