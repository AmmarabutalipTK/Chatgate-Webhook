import { FastifyReply } from "fastify";
import PdfPrinter from "pdfmake";

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

    const printer = new PdfPrinter({
      Cairo: {
        normal: "fonts/Cairo-Regular.ttf",
        bold: "fonts/Cairo-Bold.ttf",
        italics: "fonts/Cairo-Regular.ttf",
        bolditalics: "fonts/Cairo-Bold.ttf",
      },
    });

    const docDefinition = InvoiceTemplate.render(
      payload.data
    );

    const pdf = printer.createPdfKitDocument(docDefinition);

    reply.raw.setHeader(
      "Content-Type",
      "application/pdf"
    );

    reply.raw.setHeader(
      "Content-Disposition",
      `attachment; filename="Invoice-${invoiceId}.pdf"`
    );

    pdf.pipe(reply.raw);
    pdf.end();

    return reply.hijack();
  }
}