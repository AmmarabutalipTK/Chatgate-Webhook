"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventType = void 0;
var EventType;
(function (EventType) {
    EventType["CLIENT_CREATED"] = "client.created";
    EventType["CLIENT_UPDATED"] = "client.updated";
    EventType["PRODUCT_CREATED"] = "product.created";
    EventType["PRODUCT_UPDATED"] = "product.updated";
    EventType["SALESORDER_CREATED"] = "salesorder.created";
    EventType["SALESORDER_UPDATED"] = "salesorder.updated";
    EventType["INVOICE_CREATED"] = "invoice.created";
    EventType["INVENTORY_UPDATED"] = "inventory.updated";
    EventType["WORKORDER_CREATED"] = "workorder.created";
})(EventType || (exports.EventType = EventType = {}));
