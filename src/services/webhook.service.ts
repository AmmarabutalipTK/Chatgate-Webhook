import { prisma } from "../prisma";

export class WebhookService {
  static async send(payload: Record<string, any>) {
    const event = payload.event;
    const channel ="Whatsapp";


    const params = new URLSearchParams({
      event: String(event),
      Channel: String(channel),
    });

    Object.entries(payload.data ?? {}).forEach(
      ([key, value]) => {
        if (
          value !== undefined &&
          value !== null
        ) {
          params.append(
            key,
            String(value)
          );
        }
      }
    );

    const url =
      `https://api.chatgate.io/bot-api/v1.0/customer/125419/bot/899870cca0c847b4/flow/6A279921EE5B46779084F487191483C5?${params.toString()}`;

    console.log("Webhook URL:", url);

    let attempt = 0;

    while (attempt < 3) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Basic ${process.env.CHATGATE_AUTH?.trim()}`,
          },
        });

        const responseBody =
          await response.text();

        await prisma.delivery.create({
          data: {
            event,
            requestBody:
              JSON.stringify(payload),
            statusCode:
              response.status,
            success: response.ok,
            responseBody,
          },
        });

        if (response.ok) {
          return;
        }
      } catch (error: any) {
        if (attempt === 2) {
          await prisma.delivery.create({
            data: {
              event,
              requestBody:
                JSON.stringify(payload),
              success: false,
              responseBody:
                error?.message ??
                "Unknown Error",
            },
          });
        }
      }

      attempt++;

      await new Promise((resolve) =>
        setTimeout(
          resolve,
          attempt * 1000
        )
      );
    }
  }
}