import { TDocumentDefinitions } from "pdfmake/interfaces";

export class InvoiceTemplate {
  static render(invoice: any): TDocumentDefinitions {
    const total = Number(invoice.total) / 1000;

    return {
      defaultStyle: {
        font: "Cairo",
        fontSize: 11,
      },

      pageMargins: [40, 40, 40, 40],

      content: [
        {
          text: "شركة خيارات العبدالله للتوزيع",
          alignment: "right",
          bold: true,
          fontSize: 20,
          margin: [0, 0, 0, 5],
        },

        {
          text: "96415474102+",
          alignment: "right",
          color: "gray",
          margin: [0, 0, 0, 20],
        },

        {
          columns: [
            {
              width: "*",
              stack: [
                {
                  text: `Invoice #: ${
                    invoice.serial_number?.formatted ?? "-"
                  }`,
                },
                {
                  text: `Date: ${
                    invoice.issue_date ??
                    invoice.createdAt
                  }`,
                },
              ],
            },
            {
              width: "*",
              stack: [
                {
                  text: `العميل`,
                  alignment: "right",
                  bold: true,
                },
                {
                  text:
                    invoice.client_name ?? "-",
                  alignment: "right",
                },
              ],
            },
          ],
        },

        {
          text: "",
          margin: [0, 15],
        },

        {
          table: {
            headerRows: 1,

            widths: ["*", 60, 90, 90],

            body: [
              [
                {
                  text: "المنتج",
                  bold: true,
                  alignment: "right",
                },
                {
                  text: "الكمية",
                  bold: true,
                  alignment: "center",
                },
                {
                  text: "السعر",
                  bold: true,
                  alignment: "center",
                },
                {
                  text: "الإجمالي",
                  bold: true,
                  alignment: "center",
                },
              ],

              ...invoice.items.map((item: any) => [
                {
                  text:
                    item.variant.product_name,
                  alignment: "right",
                },

                {
                  text: String(item.qty),
                  alignment: "center",
                },

                {
                  text: (
                    Number(item.price) / 1000
                  ).toLocaleString("en-US"),
                  alignment: "center",
                },

                {
                  text: (
                    Number(item.line_total) /
                    1000
                  ).toLocaleString("en-US"),
                  alignment: "center",
                },
              ]),
            ],
          },

          layout: "lightHorizontalLines",
        },

        {
          text: "",
          margin: [0, 20],
        },

        {
          columns: [
            {
              width: "*",
              text: "",
            },

            {
              width: 220,

              table: {
                body: [
                  [
                    {
                      text: "الإجمالي",
                      bold: true,
                      alignment: "right",
                    },

                    {
                      text:
                        total.toLocaleString(
                          "en-US"
                        ) + " IQD",
                      bold: true,
                      alignment: "center",
                    },
                  ],
                ],
              },
            },
          ],
        },

        {
          text: "",
          margin: [0, 30],
        },

        {
          text: "شكراً لتعاملكم معنا",
          alignment: "center",
          color: "gray",
        },
      ],
    };
  }
}