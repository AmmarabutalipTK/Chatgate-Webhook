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
    });

    if (!delivery) {
      return reply.code(404).send({
        success: false,
      });
    }

    const payload = JSON.parse(delivery.requestBody);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"],
    });

    const page = await browser.newPage();

    await page.setContent(
      InvoiceTemplate.render(payload.data),
      {
        waitUntil: "load",
      }
    );

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "20mm",
        bottom: "20mm",
        left: "20mm",
      },
    });

    await browser.close();

    reply
      .type("application/pdf")
      .header(
        "Content-Disposition",
        `attachment; filename="Invoice-${invoiceId}.pdf"`
      )
      .send(pdf);
  }
}