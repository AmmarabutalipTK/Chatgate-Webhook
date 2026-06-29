export class InvoiceTemplate {
  static render(
    doc: any,
    invoice: any
  ) {
    doc.fontSize(22).text("Invoice");

    doc.moveDown();

    doc.text(`Invoice: ${invoice.serial_number.formatted}`);
    doc.text(`Customer: ${invoice.client_name}`);
    doc.text(`Date: ${invoice.createdAt}`);
    doc.text(
      `Total: ${(invoice.total / 1000).toLocaleString()} IQD`
    );

    doc.moveDown();

    invoice.items.forEach((item: any) => {
      doc.text(
        `${item.variant.product_name} x${item.qty}`
      );
    });
  }
}