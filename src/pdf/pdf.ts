import puppeteer from "puppeteer";
import { FastifyReply } from "fastify";

import { prisma } from "../prisma";
import { InvoiceTemplate } from "./invoice.template";

export class PdfService {
  static async download(
    invoiceId: string,
    reply: FastifyReply
  ) {
    /*
     * First get the requested record.
     */
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
        "Failed to parse requestBody:",
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
     * ============================================================
     * PAYMENT PDF
     * ============================================================
     *
     * PAY-1012-1704 contains:
     *
     * LinkedTxn:
     *   TxnType: invoice
     *   Txn_serial_number:
     *      formatted: INV-1012-1699
     *
     * The payment itself does NOT contain items.
     *
     * Therefore load the linked invoice from Delivery.
     */
    const isPayment =
      invoiceId.startsWith("PAY-") ||
      invoice.serial_number?.formatted?.startsWith("PAY-");

    if (isPayment) {
      const linkedInvoiceId =
        invoice.LinkedTxn?.Txn_serial_number?.formatted;

      console.log(
        "PAYMENT PDF DETECTED:",
        {
          paymentId: invoiceId,
          linkedInvoiceId,
          paymentStatus: invoice.status,
          paymentAmount: invoice.amount,
        }
      );

      if (linkedInvoiceId) {
        const linkedDelivery =
          await prisma.delivery.findFirst({
            where: {
              invoiceId: linkedInvoiceId,
            },
            orderBy: {
              createdAt: "desc",
            },
          });

        if (linkedDelivery) {
          try {
            const linkedPayload =
              JSON.parse(
                linkedDelivery.requestBody
              );

            const linkedInvoice =
              linkedPayload?.data ??
              linkedPayload;

            /*
             * Use the actual invoice as the base.
             *
             * This gives us:
             *
             * - client
             * - items
             * - prices
             * - total
             * - invoice number
             * - dates
             * - address
             * - etc.
             */
            invoice = {
              ...linkedInvoice,

              /*
               * Keep payment information.
               */
              status: "paid",

              invoice_payment_type:
                invoice.payment_type ??
                linkedInvoice.invoice_payment_type,

              /*
               * Preserve payment information
               * for anything else we may want later.
               */
              payment: invoice,
            };

            console.log(
              "LINKED INVOICE LOADED:",
              {
                paymentId: invoiceId,
                linkedInvoiceId,

                status: invoice.status,

                items: Array.isArray(
                  invoice.items
                )
                  ? invoice.items.length
                  : 0,

                returnItems: Array.isArray(
                  invoice.return_items
                )
                  ? invoice.return_items.length
                  : 0,

                total: invoice.total,
              }
            );
          } catch (error) {
            console.error(
              "Failed to parse linked invoice:",
              error
            );
          }
        } else {
          console.warn(
            `Linked invoice not found in DB: ${linkedInvoiceId}`
          );
        }
      } else {
        console.warn(
          `No LinkedTxn invoice found for payment: ${invoiceId}`
        );
      }
    }

    /*
     * ============================================================
     * VOID / CANCELLED INVOICE
     * ============================================================
     *
     * Repzo can send:
     *
     * items: []
     * return_items: [...]
     *
     * The return item contains:
     *
     * returned_from_serial_number.formatted
     *
     * We use the original invoice from our DB
     * to restore the product items.
     */
    const isVoid =
      invoice.is_void === true ||
      invoice.is_void === 1 ||
      invoice.is_void === "1";

    if (
      isVoid &&
      Array.isArray(invoice.return_items) &&
      invoice.return_items.length > 0
    ) {
      const originalInvoiceId =
        invoice.return_items[0]
          ?.returned_from_serial_number
          ?.formatted;

      console.log(
        "VOID INVOICE FALLBACK:",
        {
          invoiceId,
          originalInvoiceId,
          returnItems:
            invoice.return_items.length,
        }
      );

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

            invoice = {
              ...invoice,

              items:
                Array.isArray(
                  originalInvoice.items
                )
                  ? originalInvoice.items
                  : [],

              return_items:
                invoice.return_items,
            };

            console.log(
              "Void invoice items replaced:",
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

    /*
     * ============================================================
     * FINAL PDF DATA CHECK
     * ============================================================
     */
    console.log(
      "Generating PDF:",
      {
        requestedId: invoiceId,

        actualInvoice:
          invoice.serial_number?.formatted ??
          invoiceId,

        status: invoice.status,

        isVoid: invoice.is_void,

        client:
          invoice.client_name,

        paymentType:
          invoice.invoice_payment_type,

        total:
          invoice.total,

        items:
          Array.isArray(invoice.items)
            ? invoice.items.length
            : 0,

        returnItems:
          Array.isArray(invoice.return_items)
            ? invoice.return_items.length
            : 0,
      }
    );

    const browser =
      await puppeteer.launch({
        executablePath:
          "/usr/bin/chromium-browser",

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
      const page =
        await browser.newPage();

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

      await page.emulateMediaType(
        "screen"
      );

      const pdf =
        await page.pdf({
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