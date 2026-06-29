import { FastifyReply } from "fastify";
import puppeteer from "puppeteer";
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
    });

    if (!delivery) {
      return reply.code(404).send({
        success: false,
        message: "Invoice not found",
      });
    }

    const payload = JSON.parse(delivery.requestBody);

    const html = InvoiceTemplate.render(payload.data);

    const browser = await puppeteer.launch({
      headless: true,
    });

    const page = await browser.newPage();

await page.setContent(html, {
  waitUntil: "load",
});

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        bottom: "20px",
        left: "20px",
        right: "20px",
      },
    });

    await browser.close();

    reply
      .type("application/pdf")
      .header(
        "Content-Disposition",
        `attachment; filename="Invoice-${invoiceId}.pdf"`
      );

    return reply.send(pdf);
  }
}