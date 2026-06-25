import { prisma } from "../prisma";

export class WebhookService {
static async send(payload: Record<string, any>) {
  const event = payload.event;
  const name = payload.client_name;
const phone_no = payload?.user?.phone_no?.replace(/^\+/, "");

  console.log(phone_no)

  const params = new URLSearchParams({
    event: String(event),
     "user.phone_no": String(phone_no),
    channel: "Whatsapp",
    name:String(name)
  });

  if (payload.msg) {
    params.append("msg", String(payload.msg));
  }

  Object.entries(payload.data ?? {}).forEach(([key, value]) => {
    if (value != null) {
      params.append(key, String(value));
    }
  });

  console.log(params)
  const url = `https://api.chatgate.io/bot-api/v1.0/customer/125419/bot/899870cca0c847b4/flow/6A279921EE5B46779084F487191483C5?${params}`;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${process.env.CHATGATE_AUTH}`,
        },
      });

      const responseBody = await response.text();

      await prisma.delivery.create({
        data: {
          event,
          requestBody: JSON.stringify(payload),
          statusCode: response.status,
          success: response.ok,
          responseBody,
        },
      });

      if (response.ok) {
        return;
      }

      lastError = new Error(
        `ChatGate returned ${response.status}: ${responseBody}`
      );
    } catch (error: any) {
      lastError = error;

      if (attempt === 3) {
        await prisma.delivery.create({
          data: {
            event,
            requestBody: JSON.stringify(payload),
            success: false,
            responseBody: error?.message ?? "Unknown Error",
          },
        });
      }
    }

    if (attempt < 3) {
      await new Promise(resolve =>
        setTimeout(resolve, attempt * 1000)
      );
    }
  }

  throw lastError ?? new Error("Webhook failed after 3 attempts.");
}
}