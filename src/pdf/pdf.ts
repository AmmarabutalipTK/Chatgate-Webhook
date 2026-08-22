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

    // Support both payload shapes:
    // { data: invoice }
    // invoice
    const invoice = payload?.data ?? payload;

    if (!invoice || typeof invoice !== "object") {
      return reply.code(500).send({
        success: false,
        message: "Invalid invoice payload",
      });
    }

    console.log("Generating PDF:", {
      invoiceId,
      status: invoice.status,
      isVoid: invoice.is_void,
      items: Array.isArray(invoice.items)
        ? invoice.items.length
        : 0,
      returnItems: Array.isArray(invoice.return_items)
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

      const fileName = `Invoice-${invoiceId}.pdf`;

      return reply
        .code(200)
        .type("application/pdf")
        .header(
          "Content-Disposition",
          `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(
            fileName
          )}`
        )
        .header("Content-Length", pdf.length)
        .header("X-Content-Type-Options", "nosniff")
        .send(pdf);
    } finally {
      await browser.close();
    }
  }
}