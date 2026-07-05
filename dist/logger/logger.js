"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryLogger = void 0;
const prisma_1 = require("../prisma");
class DeliveryLogger {
    static async info(deliveryId, message) {
        return prisma_1.prisma.deliveryLog.create({
            data: {
                deliveryId,
                level: "INFO",
                message,
            },
        });
    }
    static async warning(deliveryId, message) {
        return prisma_1.prisma.deliveryLog.create({
            data: {
                deliveryId,
                level: "WARNING",
                message,
            },
        });
    }
    static async error(deliveryId, message) {
        return prisma_1.prisma.deliveryLog.create({
            data: {
                deliveryId,
                level: "ERROR",
                message,
            },
        });
    }
    static async success(deliveryId, message) {
        return prisma_1.prisma.deliveryLog.create({
            data: {
                deliveryId,
                level: "SUCCESS",
                message,
            },
        });
    }
}
exports.DeliveryLogger = DeliveryLogger;
