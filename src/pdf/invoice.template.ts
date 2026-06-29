// src/pdf/invoice.html.ts
export function generateInvoiceHtml(invoice: any): string {
  const total = Number(invoice.total ?? 0) / 1000;
  
  const rows = invoice.items.map((item: any) => {
    const unitPrice = Number(item.price ?? 0) / 1000;
    const lineTotal = Number(item.line_total ?? 0) / 1000;
    return `
      <tr>
        <td>${lineTotal.toLocaleString('en-US')}</td>
        <td>${unitPrice.toLocaleString('en-US')}</td>
        <td>${item.qty}</td>
        <td>${item.variant?.product_name ?? '-'}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Cairo', sans-serif; padding: 40px; direction: rtl; }
        @import url('https://fonts.googleapis.com/css2?family=Cairo&display=swap');
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: center; border-bottom: 1px solid #eee; }
        th { font-weight: bold; }
        td:last-child, th:last-child { text-align: right; }
      </style>
    </head>
    <body>
      <h2 style="text-align:right">شركة خيارات العبدالله للتوزيع</h2>
      <p style="text-align:right;color:gray">+9641547410201</p>
      
      <div style="display:flex;justify-content:space-between">
        <div>
          <div>رقم الفاتورة: ${invoice.serial_number?.formatted ?? '-'}</div>
          <div>التاريخ: ${invoice.issue_date ?? invoice.createdAt ?? '-'}</div>
        </div>
        <div>
          <div><b>العميل</b></div>
          <div>${invoice.client_name ?? '-'}</div>
        </div>
      </div>

      <br/>
      <table>
        <thead>
          <tr>
            <th>الإجمالي</th>
            <th>السعر</th>
            <th>الكمية</th>
            <th style="text-align:right">المنتج</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <br/>
      
      <div style="text-align:left">
        <b>الإجمالي: ${total.toLocaleString('en-US')} IQD</b>
      </div>
      
      <br/><br/>
      <p style="text-align:center;color:gray">شكراً لتعاملكم معنا</p>
    </body>
    </html>
  `;
}