import PDFDocument from "pdfkit";
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

const doc = new PDFDocument();

reply.raw.setHeader("Content-Type", "application/pdf");
reply.raw.setHeader(
  "Content-Disposition",
  `attachment; filename="Invoice-${invoiceId}.pdf"`
);

doc.pipe(reply.raw);

InvoiceTemplate.render(doc, payload.data);

doc.end();

return reply.hijack();
  }
}