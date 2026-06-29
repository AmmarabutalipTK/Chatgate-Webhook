import { TDocumentDefinitions } from "pdfmake/interfaces";

const LRI = "\u2066";
const PDI = "\u2069";

function ltr(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return `${LRI}${String(value)}${PDI}`;
}

export class InvoiceTemplate {
  static render(invoice: any): TDocumentDefinitions {
    const total = Number(invoice.total ?? 0) / 1000;

    return {
      defaultStyle: {
        font: "Cairo",
        fontSize: 11,
      },

      pageMargins: [40, 40, 40, 40],

      content: [
{
  text: [
    { text: "للتوزيع ", bold: true },
    { text: "العبدالله ", bold: true },
    { text: "خيارات ", bold: true },
    { text: ` `, bold: true },
    { text: "شركة", bold: true },
  ],
  alignment: "right",
  fontSize: 20,
},

        {
          text: ltr("+9641547410201"),
          alignment: "right",
          color: "gray",
          margin: [0, 5, 0, 20],
        },

        // Invoice Info
        {
          columns: [
            {
              width: "*",
              stack: [
                {
                  text: "العميل",
                  bold: true,
                  alignment: "right",
                },
                {
                  text: invoice.client_name ?? "-",
                  alignment: "right",
                },
              ],
            },

            {
              width: "*",
              stack: [
                {
                  text: `رقم الفاتورة: ${ltr(
                    invoice.serial_number?.formatted
                  )}`,
                  alignment: "left",
                },

                {
                  text: `التاريخ: ${ltr(
                    invoice.issue_date ??
                      invoice.createdAt
                  )}`,
                  alignment: "left",
                },
              ],
            },
          ],
        },

        {
          text: "",
          margin: [0, 20],
        },

        // Products
        {
          table: {
            headerRows: 1,

            widths: [90, 90, 60, "*"],

            body: [
              [
                {
                  text: "الإجمالي",
                  bold: true,
                  alignment: "center",
                },

                {
                  text: "السعر",
                  bold: true,
                  alignment: "center",
                },

                {
                  text: "الكمية",
                  bold: true,
                  alignment: "center",
                },

                {
                  text: "المنتج",
                  bold: true,
                  alignment: "right",
                },
              ],

              ...invoice.items.map((item: any) => {
                const productName =
                  item?.variant?.product_name ??
                  item?.product_name ??
                  "منتج غير معروف";

                const unitPrice =
                  Number(item.price ?? 0) / 1000;

                const lineTotal =
                  Number(item.line_total ?? 0) / 1000;

                return [
                  {
                    text: ltr(
                      lineTotal.toLocaleString("en-US")
                    ),
                    alignment: "center",
                  },

                  {
                    text: ltr(
                      unitPrice.toLocaleString("en-US")
                    ),
                    alignment: "center",
                  },

                  {
                    text: ltr(item.qty),
                    alignment: "center",
                  },

                  {
                    text: productName,
                    alignment: "right",
                  },
                ];
              }),
            ],
          },

          layout: "lightHorizontalLines",
        },

        {
          text: "",
          margin: [0, 20],
        },

        // Total
        {
          columns: [
            {
              width: "*",
              text: "",
            },

            {
              width: 220,

              table: {
                widths: ["*", 90],

                body: [
                  [
                    {
                      text: ltr(
                        `${total.toLocaleString(
                          "en-US"
                        )} IQD`
                      ),
                      bold: true,
                      alignment: "center",
                    },

                    {
                      text: "الإجمالي",
                      bold: true,
                      alignment: "right",
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