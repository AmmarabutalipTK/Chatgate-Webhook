import { WebhookService } from "../services/webhook.service";

export class EventBus {
  async dispatch(
    event: string,
    data: unknown
  ) {
    const payload = {
      event,
      occurred_at: new Date().toISOString(),
      data,
    };

    await WebhookService.send(payload);
  }
}

export const eventBus = new EventBus();