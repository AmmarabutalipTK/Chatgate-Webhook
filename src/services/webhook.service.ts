import { prisma } from "../prisma";

export class WebhookService {
  static async send(payload: Record<string, any>) {
const phoneNo =
  payload?.data?.phone_no ??
  payload?.phone_no;

if (!phoneNo) {
  throw new Error(
    `Missing required field: phone_no for event ${payload.event}`
  );
}

const params = new URLSearchParams({
  event: payload.event,
  Channel: "Whatsapp",
  "user.phone_no": phoneNo,
});

Object.entries(payload.data ?? {}).forEach(
  ([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  }
);
const url =`https://api.chatgate.io/bot-api/v1.0/customer/125419/bot/899870cca0c847b4/flow/6A279921EE5B46779084F487191483C5?${params.toString()}`;

console.log(url);

    let attempt = 0;


    console.log({auth:process.env.CHATGATE_AUTH?.trim()})
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
            event: payload.event,
            requestBody: JSON.stringify(payload),
            statusCode: response.status,
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
              event: payload.event,
              requestBody: JSON.stringify(payload),
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
        setTimeout(resolve, attempt * 1000)
      );
    }
  }
}