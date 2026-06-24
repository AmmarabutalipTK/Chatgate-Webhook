import { WebhookService } from "../services/webhook.service";

export class EventBus {
  async dispatch(payload: Record<string, any>) {
    await WebhookService.send(payload);
  }
}

export const eventBus = new EventBus();