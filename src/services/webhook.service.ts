import axios from "axios";
import { prisma } from "../prisma";

export class WebhookService {
static async send(payload: Record<string, any>) {
  const event = payload.event;
  const name = payload.client_name;
  const total = payload.total;
  const invoiceId = payload.invoiceId
const phone_no = payload?.user?.phone_no?.replace(/^\+/, "");

  console.log(phone_no)

  const params = new URLSearchParams({
    event: String(event),
     "user.phone_no": String(phone_no),
    channel: "Whatsapp",
    name:String(name),
    total:String(total.toFixed(3)),
    invoiceId:String(invoiceId)
  });

  if (payload.msg) {
    params.append("msg", String(payload.msg));
  }

  // Object.entries(payload.data ?? {}).forEach(([key, value]) => {
  //   if (value != null) {
  //     params.append(key, String(value));
  //   }
  // });

  console.log(params)
  const url = `https://api.chatgate.io/bot-api/v1.0/customer/125419/bot/899870cca0c847b4/flow/6A279921EE5B46779084F487191483C5?${params}`;

try {
  const response = await axios.post(url, payload, {
    headers: {
      Authorization: `Basic ${process.env.CHATGATE_AUTH}`,
    },
  });

  await prisma.delivery.create({
    data: {
      event,
      requestBody: JSON.stringify(payload),
      statusCode: response.status,
      success: true,
      responseBody: JSON.stringify(response.data),
    },
  });
} catch (error: any) {
  const statusCode = error.response?.status;
  const responseBody =
    typeof error.response?.data === "string"
      ? error.response.data
      : JSON.stringify(error.response?.data ?? { message: error.message });

  await prisma.delivery.create({
    data: {
      event,
      requestBody: JSON.stringify(payload),
      statusCode,
      success: false,
      responseBody,
    },
  });

  throw error;
}
}
}