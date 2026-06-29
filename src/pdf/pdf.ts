import path from "path";
import { FastifyReply } from "fastify";
import puppeteer from "puppeteer";
import { prisma } from "../prisma";
import { generateInvoiceHtml } from "./invoice.template";


export class PdfService {
  static async download(invoiceId: string, reply: FastifyReply) {
    const delivery = await prisma.delivery.findFirst({
      where: { invoiceId },
    });

    if (!delivery) {
      return reply.code(404).send({ success: false, message: "Invoice not found" });
    }

    const payload = JSON.parse(delivery.requestBody);
    const html = generateInvoiceHtml(payload.data);

    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    await page.setContent(html, { waitUntil: 'load' }); // ينتظر تحميل الخط
    
    const pdfBuffer = await page.pdf({ format: 'A4', margin: { top: 40, bottom: 40, left: 40, right: 40 } });
    
    await browser.close();

    reply.header("Content-Type", "application/pdf");
    reply.header("Content-Disposition", `attachment; filename="Invoice-${invoiceId}.pdf"`);
    
    return reply.send(pdfBuffer);
  }
}