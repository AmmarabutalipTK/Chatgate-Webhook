import { prisma } from "../prisma";

export class DeliveryLogger {
  static async info(deliveryId: string, message: string) {
    return prisma.deliveryLog.create({
      data: {
        deliveryId,
        level: "INFO",
        message,
      },
    });
  }

  static async warning(deliveryId: string, message: string) {
    return prisma.deliveryLog.create({
      data: {
        deliveryId,
        level: "WARNING",
        message,
      },
    });
  }

  static async error(deliveryId: string, message: string) {
    return prisma.deliveryLog.create({
      data: {
        deliveryId,
        level: "ERROR",
        message,
      },
    });
  }

  static async success(deliveryId: string, message: string) {
    return prisma.deliveryLog.create({
      data: {
        deliveryId,
        level: "SUCCESS",
        message,
      },
    });
  }
}