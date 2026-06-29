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

    reply.header("Content-Type", "application/pdf");
    reply.header(
      "Content-Disposition",
      `attachment; filename="Invoice-${invoiceId}.pdf"`
    );

    const doc = new PDFDocument();

    doc.pipe(reply.raw);

    InvoiceTemplate.render(doc, payload.data);

    doc.end();
  }
}