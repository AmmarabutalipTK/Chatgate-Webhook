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
     * ============================================================
     * FIND THE CORRECT INVOICE DELIVERY
     * ============================================================
     *
     * There can be multiple Delivery records for the same invoice.
     *
     * Some records can be payment/transaction events such as:
     *
     * status: "consumed"
     *
     * Those are NOT invoice payloads and should not be used
     * to generate the invoice PDF.
     */

    const deliveries = await prisma.delivery.findMany({
      where: {
        invoiceId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!deliveries.length) {
      return reply.code(404).send({
        success: false,
        message: "Invoice not found",
      });
    }

    let delivery: any = null;
    let invoice: any = null;

    /*
     * Search from newest to oldest until we find an actual
     * invoice payload.
     */
    for (const candidate of deliveries) {
      try {
        const payload = JSON.parse(
          candidate.requestBody
        );

        const data =
          payload?.data ?? payload;

        if (!data || typeof data !== "object") {
          continue;
        }

        /*
         * Actual invoice payload indicators.
         *
         * Payment events such as "consumed" normally don't
         * contain these invoice structures.
         */
        const isInvoicePayload =
          data?.serial_number?.formatted === invoiceId ||
          Array.isArray(data?.items) ||
          Array.isArray(data?.return_items) ||
          data?.is_void !== undefined;

        if (isInvoicePayload) {
          delivery = candidate;
          invoice = data;
          break;
        }
      } catch (error) {
        console.error(
          `Failed to parse Delivery ${candidate.id}:`,
          error
        );
      }
    }

    if (!delivery || !invoice) {
      return reply.code(404).send({
        success: false,
        message: "Invoice data not found",
      });
    }

    console.log(
      "========================================"
    );

    console.log("Invoice delivery selected:", {
      requestedInvoiceId: invoiceId,
      deliveryId: delivery.id,
      createdAt: delivery.createdAt,
      status: invoice.status,
      serial:
        invoice.serial_number?.formatted,
      items: Array.isArray(invoice.items)
        ? invoice.items.length
        : 0,
      returnItems: Array.isArray(
        invoice.return_items
      )
        ? invoice.return_items.length
        : 0,
      isVoid: invoice.is_void,
    });

    console.log(
      "========================================"
    );

    /*
     * ============================================================
     * VOID / CANCEL / RETURN INVOICE
     * ============================================================
     *
     * Example:
     *
     * INV-ADM-3326
     *
     * items: []
     *
     * return_items:
     * [
     *   {
     *     returned_from_serial_number: {
     *       formatted: "INV-ADM-3323"
     *     }
     *   }
     * ]
     *
     * We fetch INV-ADM-3323 from our DB and use its items.
     */

    const isVoid =
      invoice.is_void === true ||
      invoice.is_void === 1 ||
      invoice.is_void === "true";

    const hasEmptyItems =
      !Array.isArray(invoice.items) ||
      invoice.items.length === 0;

    const hasReturnItems =
      Array.isArray(invoice.return_items) &&
      invoice.return_items.length > 0;

    if (
      isVoid &&
      hasEmptyItems &&
      hasReturnItems
    ) {
      const originalInvoiceId =
        invoice.return_items?.[0]
          ?.returned_from_serial_number
          ?.formatted;

      console.log(
        "========================================"
      );

      console.log("VOID INVOICE FALLBACK:", {
        invoiceId,
        originalInvoiceId,
        currentItems: Array.isArray(
          invoice.items
        )
          ? invoice.items.length
          : 0,
        returnItems:
          invoice.return_items.length,
      });

      console.log(
        "========================================"
      );

      if (originalInvoiceId) {
        /*
         * Find the original invoice.
         *
         * Again, don't blindly use the newest Delivery
         * because there may be payment events.
         */
        const originalDeliveries =
          await prisma.delivery.findMany({
            where: {
              invoiceId:
                originalInvoiceId,
            },
            orderBy: {
              createdAt: "desc",
            },
          });

        let originalInvoice: any = null;
        let originalDelivery: any = null;

        for (const candidate of originalDeliveries) {
          try {
            const originalPayload =
              JSON.parse(
                candidate.requestBody
              );

            const data =
              originalPayload?.data ??
              originalPayload;

            if (
              !data ||
              typeof data !== "object"
            ) {
              continue;
            }

            /*
             * Original invoice must contain actual
             * invoice items or return items.
             */
            const isActualInvoice =
              data?.serial_number?.formatted ===
                originalInvoiceId ||
              Array.isArray(data?.items) ||
              Array.isArray(
                data?.return_items
              );

            if (
              isActualInvoice &&
              Array.isArray(data?.items) &&
              data.items.length > 0
            ) {
              originalDelivery =
                candidate;

              originalInvoice = data;

              break;
            }
          } catch (error) {
            console.error(
              `Failed to parse original Delivery ${candidate.id}:`,
              error
            );
          }
        }

        if (
          originalDelivery &&
          originalInvoice
        ) {
          const originalItems =
            Array.isArray(
              originalInvoice.items
            )
              ? originalInvoice.items
              : [];

          console.log(
            "========================================"
          );

          console.log(
            "ORIGINAL INVOICE FOUND:",
            {
              originalInvoiceId,
              originalDeliveryId:
                originalDelivery.id,
              originalCreatedAt:
                originalDelivery.createdAt,
              originalStatus:
                originalInvoice.status,
              originalItems:
                originalItems.length,
              originalTotal:
                originalInvoice.total,
            }
          );

          console.log(
            "========================================"
          );

          /*
           * Keep the VOID invoice data:
           *
           * - serial number
           * - total
           * - status
           * - is_void
           * - return information
           *
           * Only replace the empty items.
           */
          invoice = {
            ...invoice,
            items: originalItems,
          };

          console.log(
            "Void invoice items replaced:",
            {
              invoiceId,
              items:
                Array.isArray(
                  invoice.items
                )
                  ? invoice.items.length
                  : 0,
            }
          );
        } else {
          console.warn(
            `Original invoice not found or has no items: ${originalInvoiceId}`
          );
        }
      } else {
        console.warn(
          `Void invoice ${invoiceId} has no returned_from_serial_number`
        );
      }
    }

    /*
     * ============================================================
     * NORMALIZE STATUS
     * ============================================================
     *
     * Some Repzo events may contain:
     *
     * paid
     * unpaid
     * consumed
     *
     * "consumed" is a payment event and should be displayed
     * as "مدفوعة" rather than literally showing "consumed".
     */

    const normalizedStatus =
      String(invoice.status ?? "")
        .trim()
        .toLowerCase();

    if (
      normalizedStatus === "consumed"
    ) {
      invoice = {
        ...invoice,
        status: "paid",
      };
    }

    /*
     * ============================================================
     * FINAL LOG
     * ============================================================
     */

    console.log(
      "========================================"
    );

    console.log("Generating PDF:", {
      invoiceId,
      status: invoice.status,
      isVoid: invoice.is_void,
      total: invoice.total,

      items: Array.isArray(invoice.items)
        ? invoice.items.length
        : 0,

      returnItems: Array.isArray(
        invoice.return_items
      )
        ? invoice.return_items.length
        : 0,
    });

    console.log(
      "========================================"
    );

    /*
     * ============================================================
     * GENERATE PDF
     * ============================================================
     */

    const browser = await puppeteer.launch({
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
        InvoiceTemplate.render(
          invoice
        ),
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