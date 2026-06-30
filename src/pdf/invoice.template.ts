import fs from "fs";
import path from "path";

const logo = fs.readFileSync(
  path.join(__dirname, "../assets/logo.png")
);
const logoBase64 = logo.toString("base64");

const formatDate = (date?: string) =>
  date
    ? new Date(date).toLocaleDateString("ar-IQ", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : "-";

export class InvoiceTemplate {
  static render(invoice: any) {
 const formatMoney = (value: number = 0) =>
  `${(Number(value) / 1000).toLocaleString("en-US")} IQD`;

    const statusMap: Record<string, string> = {
  unpaid: "غير مدفوعة",
  paid: "مدفوعة",
  void: "ملغية",
};

const status = statusMap[invoice.status] ?? invoice.status;

const statusColor =
  invoice.status === "paid"
    ? "#16a34a"
    : invoice.status === "void"
    ? "#6b7280"
    : "#dc2626";

    return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">

<head>

<meta charset="UTF-8">

<link
href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap"
rel="stylesheet"
/>

<style>

*{
margin:0;
padding:0;
box-sizing:border-box;
}

body{
font-family:'Cairo',sans-serif;
direction:rtl;
padding:30px;
color:#222;
font-size:13px;
}

.header{
display:flex;
justify-content:space-between;
align-items:flex-start;
margin-bottom:25px;
}

.invoice-title{
font-size:42px;
font-weight:700;
}

.logo img{
height:100px;
}

.company{
margin-top:15px;
text-align:right;
line-height:1.8;
}

.company h2{
font-size:28px;
margin-bottom:8px;
}

.top-row{
display:flex;
justify-content:space-between;
margin-top:20px;
margin-bottom:25px;
}

.customer{
font-size:15px;
line-height:2;
}

.customer strong{
font-weight:700;
}

.divider{
border-top:1px solid #ccc;
margin:20px 0;
}

.info-grid{
display:grid;
grid-template-columns:repeat(4,1fr);
gap:18px;
margin-bottom:20px;
}

.info{
line-height:1.9;
}

.label{
font-size:12px;
color:#666;
}

.value{
font-size:15px;
font-weight:700;
}

.status{
display:inline-block;
background:#ef4444;
color:white;
padding:6px 14px;
border-radius:4px;
font-size:13px;
font-weight:700;
}

table{
width:100%;
border-collapse:collapse;
margin-top:25px;
}

thead{
background:#ececec;
}

th{
border:1px solid #bfbfbf;
padding:10px;
font-weight:700;
font-size:14px;
}

td{
border:1px solid #cfcfcf;
padding:10px;
text-align:center;
}

tbody tr:nth-child(even){
background:#fafafa;
}

.summary{
width:330px;
margin-right:auto;
margin-top:30px;
}

.summary table{
margin-top:0;
}

.summary td{
border:none;
padding:7px 0;
text-align:right;
}

.summary td:last-child{
text-align:left;
font-weight:bold;
}

.grand-total td{
font-size:20px;
font-weight:700;
padding-top:14px;
}

.footer{
margin-top:40px;
text-align:center;
color:#777;
font-size:12px;
}

</style>

</head>

<body>

<div class="header">

<div class="invoice-title">
فاتورة
</div>

<div class="logo">
<img src="data:image/png;base64,${logoBase64}" />
</div>

</div>

<div class="top-row">س

<div class="company">

<h2>شركة خيرات العبدالله للتوزيع</h2>

<div>
<strong>الرقم الضريبي:</strong>
${invoice.tax_number ?? "-"}
</div>

</div>

<div class="customer">

<div>
<strong>اسم العميل:</strong>
${invoice.client_name?.replace(/^[^-]+-\s*/, "") ?? "-"}
</div>

  <div>
    <strong>رقم الفاتورة:</strong>
    ${invoice.serial_number?.formatted ?? "-"}
  </div>
</div>

</div>

<div class="divider"></div>

<div class="info-grid">

<div class="info">
<div class="label">تاريخ الإنشاء</div>
<div class="value">${formatDate(invoice.createdAt)}</div>
</div>

<div class="info">
<div class="label">تاريخ الإصدار</div>
<div class="value">${formatDate(invoice.issue_date)}</div>
</div>

<div class="info">
<div class="label">تاريخ الاستحقاق</div>
<div class="value">${formatDate(invoice.due_date)}</div>
</div>

<div class="info">
<div class="label">حالة الفاتورة</div>
<div
class="status"
style="background:${statusColor}">
${status}
</div>
</div>

<div class="info">
<div class="label">رمز العميل</div>
<div class="value">
${invoice.client_id?.slice(-6) ?? "-"}
</div>
</div>

<div class="info">
<div class="label">رقم العميل</div>
<div class="value">${invoice.client_phone ?? "-"}</div>
</div>

<div class="info">
<div class="label">عنوان العميل</div>
<div class="value">${invoice.address ?? "-"}</div>
</div>

<div class="info">
<div class="label">التعليق</div>
<div class="value">${invoice.comment ?? "-"}</div>
</div>




<div class="info">
<div class="label">طريقة الدفع</div>
<div class="value">
${invoice.invoice_payment_type === "cash"
  ? "نقداً"
  : invoice.invoice_payment_type ?? "-"}
</div>
</div>



<div class="info">
<div class="label">حالة التسليم</div>
<div class="value">
${invoice.delivered_status === "delivered"
  ? "تم التسليم"
  : "قيد التنفيذ"}
</div>
</div>

</div>

<table>

<thead>

<tr>

<th>#</th>

<th>SKU</th>

<th>اسم المنتج</th>

<th>الكمية</th>

<th>السعر</th>

<th>الإجمالي</th>

</tr>

</thead>

<tbody>

${invoice.items
  .map(
    (item: any, index: number) => `
<tr>

<td>${index + 1}</td>

<td>${item.variant?.product_sku ??
item.variant?.variant_sku ??
"-"}</td>

<td style="text-align:right;padding-right:15px;">
${item.variant?.product_name?.replace(/^\*+/, "").trim() ?? ""}
</td>

<td>${item.qty}</td>

<td>${formatMoney(item.price)}</td>

<td>${formatMoney(item.line_total)}</td>

</tr>
`
  )
  .join("")}

</tbody>

</table>

<div class="summary">

<table>

<tr>
<td>المجموع الفرعي</td>
<td>${formatMoney(invoice.subtotal)}</td>
</tr>

<tr>
<td>الخصم</td>
<td>${formatMoney(invoice.discount_amount)}</td>
</tr>

${Object.values(invoice.taxes ?? {})
  .map(
    (tax: any) => `
<tr>
<td>${tax.name} (${tax.rate}%)</td>
<td>${formatMoney(tax.total)}
</td>
</tr>`
  )
  .join("")}

<tr class="grand-total">
<td>الإجمالي</td>
<td>${formatMoney(invoice.total)}</td>
</tr>

</table>

</div>

</body>

</html>

`;
  }
}