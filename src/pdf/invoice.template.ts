export class InvoiceTemplate {
  static render(doc: any, invoice: any) {
    const total = Number(invoice.total ?? 0) / 1000;

    // Header
    doc
      .fontSize(22)
      .text("Al-Abdullah Distribution Company", {
        align: "center",
      });

    doc
      .fontSize(10)
      .fillColor("gray")
      .text("Phone: +96415474102", {
        align: "center",
      });

    doc.moveDown(2);

    // Invoice Info
    doc.fillColor("black").fontSize(12);

    doc.text(`Invoice #: ${invoice.serial_number?.formatted ?? "-"}`);
    doc.text(`Customer : ${invoice.client_name ?? "-"}`);
    doc.text(`Date     : ${invoice.issue_date ?? invoice.createdAt}`);

    doc.moveDown();

    // Products
    doc.fontSize(14).text("Products");
    doc.moveDown(0.5);

    invoice.items.forEach((item: any) => {
      const price = Number(item.line_total ?? 0) / 1000;

      doc.text(
        `${item.variant.product_name}  × ${item.qty}   ${price.toLocaleString(
          "en-US"
        )} IQD`
      );
    });

    doc.moveDown();

    // Total
    doc
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke();

    doc.moveDown();

    doc
      .fontSize(16)
      .text(
        `Grand Total: ${total.toLocaleString("en-US")} IQD`,
        {
          align: "right",
        }
      );

    doc.moveDown(2);

    doc
      .fontSize(10)
      .fillColor("gray")
      .text("Thank you for your business.", {
        align: "center",
      });
  }
}