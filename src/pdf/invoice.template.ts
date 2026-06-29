import { TDocumentDefinitions } from "pdfmake/interfaces";

// Unicode bidi control chars.
// LRI/PDI isolate a run of LTR content (numbers, latin codes, phone numbers)
// so it doesn't get visually reversed when placed inside RTL-aligned text.
const LRI = "\u2066"; // Left-to-Right Isolate
const PDI = "\u2069"; // Pop Directional Isolate

/** Wrap any LTR token (numbers, IDs, phone numbers) so it renders correctly inside RTL alignment. */
function ltr(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  return `${LRI}${String(value)}${PDI}`;
}

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
          // was: "96415474102+"  -> bidi was flipping the + and digit order.
          // ltr() isolates the number so it always reads +9641547... left-to-right.
          text: ltr("+9641547410201"),
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
                  // Invoice number isolated so "INV-1020-278" doesn't get reordered.
                  text: `Invoice #: ${ltr(invoice.serial_number?.formatted ?? "-")}`,
                },
                {
                  text: `Date: ${ltr(invoice.issue_date ?? invoice.createdAt)}`,
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
                  // was rendering "CC1234-" instead of "-1234CC" / correct order.
                  // client_name often contains a mixed code (letters+digits+dash),
                  // isolating it keeps the literal character order intact.
                  text: ltr(invoice.client_name),
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

              ...invoice.items.map((item: any) => {
                // Guard against missing/malformed product data instead of
                // silently rendering "*" with no way to tell what happened.
                const productName =
                  item?.variant?.product_name &&
                  String(item.variant.product_name).trim().length > 0
                    ? item.variant.product_name
                    : "منتج غير معروف"; // "Unknown product" - visible fallback for bad data

                return [
                  {
                    text: productName,
                    alignment: "right",
                  },

                  {
                    text: ltr(item.qty),
                    alignment: "center",
                  },

                  {
                    text: ltr(
                      (Number(item.price) / 1000).toLocaleString("en-US")
                    ),
                    alignment: "center",
                  },

                  {
                    text: ltr(
                      (Number(item.line_total) / 1000).toLocaleString("en-US")
                    ),
                    alignment: "center",
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
                      text: ltr(total.toLocaleString("en-US") + " IQD"),
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