import { arabic } from "../utils/arabic";

export class InvoiceTemplate {
  static render(
    doc: any,
    invoice: any,
    createdAt?: Date
  ) {
    const total = Number(invoice.total ?? 0) / 1000;

    // ===== Header =====
    doc
      .font("Arabic-Bold")
      .fontSize(22)
      .fillColor("black")
      .text("Al-Abdullah Distribution Company", {
        align: "center",
      });

    doc
      .font("Arabic")
      .fontSize(10)
      .fillColor("gray")
      .text("Phone: +96415474102", {
        align: "center",
      });

    doc.moveDown(2);

    // ===== Invoice Information =====
    doc
      .font("Arabic-Bold")
      .fontSize(14)
      .fillColor("black")
      .text("Invoice Information");

    doc.moveDown(0.5);

    doc.font("Arabic").fontSize(12);

    doc.text(
      `Invoice #: ${invoice.serial_number?.formatted ?? "-"}`
    );

    doc.text(
      `Customer: ${arabic(invoice.client_name ?? "-")}`,
      {
        align: "right",
      }
    );

    doc.text(
      `Date: ${invoice.issue_date ?? invoice.createdAt}`
    );

    if (createdAt) {
      doc.text(
        `Generated: ${createdAt.toLocaleString("en-GB", {
          timeZone: "Asia/Riyadh",
        })}`
      );
    }

    doc.moveDown();

    // ===== Products =====
    doc
      .font("Arabic-Bold")
      .fontSize(14)
      .fillColor("black")
      .text("Products");

    doc.moveDown(0.5);

    doc.font("Arabic").fontSize(12);

    invoice.items.forEach((item: any) => {
      const unitPrice =
        Number(item.price ?? 0) / 1000;

      const lineTotal =
        Number(item.line_total ?? 0) / 1000;

      doc.text(
        `${arabic(item.variant?.product_name ?? "-")}`
      );

      doc.text(
        `Qty: ${item.qty}    Unit: ${unitPrice.toLocaleString(
          "en-US"
        )} IQD    Total: ${lineTotal.toLocaleString(
          "en-US"
        )} IQD`
      );

      doc.moveDown(0.5);
    });

    doc.moveDown();

    // ===== Divider =====
    doc
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke();

    doc.moveDown();

    // ===== Grand Total =====
    doc
      .font("Arabic-Bold")
      .fontSize(16)
      .fillColor("black")
      .text(
        `Grand Total: ${total.toLocaleString(
          "en-US"
        )} IQD`,
        {
          align: "right",
        }
      );

    doc.moveDown(2);

    // ===== Footer =====
    doc
      .font("Arabic")
      .fontSize(10)
      .fillColor("gray")
      .text(
        "Thank you for your business.",
        {
          align: "center",
        }
      );
  }
}