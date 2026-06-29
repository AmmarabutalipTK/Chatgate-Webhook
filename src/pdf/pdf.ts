import path from "path";
import { FastifyReply } from "fastify";
import PdfPrinter from "pdfmake";

import { prisma } from "../prisma";
import { InvoiceTemplate } from "./invoice.template";

const printer = new PdfPrinter({
  Cairo: {
    normal: path.join(
      process.cwd(),
      "fonts",
      "Cairo-Regular.ttf"
    ),
    bold: path.join(
      process.cwd(),
      "fonts",
      "Cairo-Bold.ttf"
    ),
    italics: path.join(
      process.cwd(),
      "fonts",
      "Cairo-Regular.ttf"
    ),
    bolditalics: path.join(
      process.cwd(),
      "fonts",
      "Cairo-Bold.ttf"
    ),
  },
});

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

    const docDefinition = InvoiceTemplate.render(
      payload.data
    );

    const pdf = printer.createPdfKitDocument(
      docDefinition
    );

    reply.header(
      "Content-Type",
      "application/pdf"
    );

    reply.header(
      "Content-Disposition",
      `attachment; filename="Invoice-${invoiceId}.pdf"`
    );

    pdf.pipe(reply.raw);
    pdf.end();

    return reply.hijack();
  }
}