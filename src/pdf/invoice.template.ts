export class InvoiceTemplate {
  static render(invoice: any) {
    const formatMoney = (value: number) =>
      `${(value / 1000).toLocaleString("en-US")} IQD`;

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
height:75px;
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
<img src="../assets/logo.png" />
</div>

</div>

<div class="top-row">

<div class="company">

<h2>شركة خيارات العبدالله للتوزيع</h2>

<div>
<strong>الرقم الضريبي:</strong>
${invoice.tax_number ?? "-"}
</div>

</div>

<div class="customer">

<div>
<strong>اسم العميل:</strong>
${invoice.client_name ?? "-"}
</div>

<div>
<strong>الرقم المتسلسل:</strong>
${invoice.number ?? invoice.invoice_number ?? "-"}
</div>

</div>

</div>

<div class="divider"></div>

<div class="info-grid">

<div class="info">
<div class="label">تاريخ الإنشاء</div>
<div class="value">${invoice.created_at ?? "-"}</div>
</div>

<div class="info">
<div class="label">تاريخ الإصدار</div>
<div class="value">${invoice.issue_date ?? "-"}</div>
</div>

<div class="info">
<div class="label">تاريخ الاستحقاق</div>
<div class="value">${invoice.due_date ?? "-"}</div>
</div>

<div class="info">
<div class="label">حالة الفاتورة</div>
<div class="status">
${invoice.status ?? "غير مدفوع"}
</div>
</div>

<div class="info">
<div class="label">رمز العميل</div>
<div class="value">${invoice.client_code ?? "-"}</div>
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

<td>${item.variant?.sku ?? "-"}</td>

<td style="text-align:right;padding-right:15px;">
${item.variant?.product_name?.replace(/^\\*/, "") ?? ""}
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

<td>المجموع قبل الضريبة</td>

<td>${formatMoney(invoice.subtotal ?? invoice.total)}</td>

</tr>

<tr>

<td>قيمة الخصم</td>

<td>${formatMoney(invoice.discount ?? 0)}</td>

</tr>

<tr class="grand-total">

<td>المبلغ الإجمالي</td>

<td>${formatMoney(invoice.total)}</td>

</tr>

</table>

</div>

<div class="footer">

Powered By Repzo

</div>

</body>

</html>

`;
  }
}