"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfService = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const prisma_1 = require("../prisma");
const invoice_template_1 = require("./invoice.template");
class PdfService {
    static async download(invoiceId, reply) {
        const delivery = await prisma_1.prisma.delivery.findFirst({
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
        // Support both payload shapes:
        // { data: invoice }
        // invoice
        const invoice = payload?.data ?? payload;
        const browser = await puppeteer_1.default.launch({
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
            await page.setContent(invoice_template_1.InvoiceTemplate.render(invoice), {
                waitUntil: "load",
            });
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
                .header("Content-Disposition", `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`)
                .header("Content-Length", pdf.length)
                .header("X-Content-Type-Options", "nosniff")
                .send(pdf);
        }
        finally {
            await browser.close();
        }
    }
}
exports.PdfService = PdfService;
