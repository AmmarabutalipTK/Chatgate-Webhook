import puppeteer from "puppeteer";
import { FastifyReply } from "fastify";

import { prisma } from "../prisma";
import { InvoiceTemplate } from "./invoice.template";

export class PdfService {
  static async download(
    invoiceId: string,
    reply: FastifyReply
  ) {
    const delivery = await prisma.delivery.findFirst({
      where: {
        invoiceId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!delivery) {
      return reply.code(404).send({
        success: false,
        message: "Invoice not found",
      });
    }

    let payload: any;

    try {
      payload = JSON.parse(delivery.requestBody);
    } catch (error) {
      console.error(
        "Failed to parse invoice requestBody:",
        error
      );

      return reply.code(500).send({
        success: false,
        message: "Invalid invoice data",
      });
    }

    let invoice = payload?.data ?? payload;

    if (!invoice || typeof invoice !== "object") {
      return reply.code(500).send({
        success: false,
        message: "Invalid invoice payload",
      });
    }

    /*
     * For void/cancel invoices:
     *
     * Repzo sends:
     *
     * items: []
     * return_items: [...]
     *
     * return_items contains:
     *
     * returned_from_serial_number.formatted
     *
     * Example:
     *
     * INV-ADM-3326
     *      ↓
     * INV-ADM-3323
     *
     * We use the original invoice from our DB
     * to get the actual product items.
     */
    const isVoid =
      invoice.is_void === true ||
      invoice.is_void === 1;

    if (
      isVoid &&
      Array.isArray(invoice.return_items) &&
      invoice.return_items.length > 0
    ) {
      const originalInvoiceId =
        invoice.return_items[0]
          ?.returned_from_serial_number
          ?.formatted;

      console.log("Void invoice detected:", {
        invoiceId,
        originalInvoiceId,
      });

      if (originalInvoiceId) {
        const originalDelivery =
          await prisma.delivery.findFirst({
            where: {
              invoiceId: originalInvoiceId,
            },
            orderBy: {
              createdAt: "desc",
            },
          });

        if (originalDelivery) {
          try {
            const originalPayload =
              JSON.parse(
                originalDelivery.requestBody
              );

            const originalInvoice =
              originalPayload?.data ??
              originalPayload;

            /*
             * Keep the cancellation invoice's data,
             * but replace its empty items with the
             * original invoice items.
             */
            invoice = {
              ...invoice,

              items:
                Array.isArray(originalInvoice.items)
                  ? originalInvoice.items
                  : [],

              /*
               * Keep the original return_items too,
               * but the template will use items first.
               */
              return_items:
                invoice.return_items,
            };

            console.log(
              "Original invoice items loaded:",
              {
                originalInvoiceId,
                items: Array.isArray(
                  originalInvoice.items
                )
                  ? originalInvoice.items.length
                  : 0,
              }
            );
          } catch (error) {
            console.error(
              "Failed to parse original invoice:",
              error
            );
          }
        } else {
          console.warn(
            `Original invoice not found in DB: ${originalInvoiceId}`
          );
        }
      }
    }

    console.log("Generating PDF:", {
      invoiceId,
      status: invoice.status,
      isVoid: invoice.is_void,

      items: Array.isArray(invoice.items)
        ? invoice.items.length
        : 0,

      returnItems: Array.isArray(
        invoice.return_items
      )
        ? invoice.return_items.length
        : 0,
    });

    const browser = await puppeteer.launch({
      executablePath: "/usr/bin/chromium-browser",
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--single-process",
      ],
    });

    try {
      const page = await browser.newPage();

      await page.setViewport({
        width: 1240,
        height: 1754,
        deviceScaleFactor: 2,
      });

      await page.setContent(
        InvoiceTemplate.render(invoice),
        {
          waitUntil: "load",
        }
      );

      await page.emulateMediaType("screen");

      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: "20mm",
          right: "20mm",
          bottom: "20mm",
          left: "20mm",
        },
      });

      const fileName =
        `Invoice-${invoiceId}.pdf`;

      return reply
        .code(200)
        .type("application/pdf")
        .header(
          "Content-Disposition",
          `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(
            fileName
          )}`
        )
        .header(
          "Content-Length",
          pdf.length
        )
        .header(
          "X-Content-Type-Options",
          "nosniff"
        )
        .send(pdf);
    } finally {
      await browser.close();
    }
  }
}