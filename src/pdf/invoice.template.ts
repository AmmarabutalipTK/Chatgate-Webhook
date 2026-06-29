export class InvoiceTemplate {
  static render(invoice: any) {
    const total = Number(invoice.total) / 1000;

    return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">

<head>

<meta charset="UTF-8">

<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet">

<style>

body{
    font-family:Cairo,sans-serif;
    direction:rtl;
    margin:40px;
    color:#222;
}

h1{
    text-align:center;
    margin-bottom:4px;
}

.phone{
    text-align:center;
    color:#666;
    margin-bottom:30px;
}

.info{
    display:flex;
    justify-content:space-between;
    margin-bottom:25px;
}

table{
    width:100%;
    border-collapse:collapse;
}

th,td{
    border:1px solid #ddd;
    padding:10px;
}

th{
    background:#f5f5f5;
}

.total{
    margin-top:20px;
    text-align:left;
    font-size:18px;
    font-weight:bold;
}

.footer{
    margin-top:40px;
    text-align:center;
    color:#777;
}

</style>

</head>

<body>

<h1>شركة خيارات العبدالله للتوزيع</h1>

<div class="phone">
+9641547410201
</div>

<div class="info">

<div>

<strong>العميل</strong><br>

${invoice.client_name}

</div>

<div style="text-align:left">

Invoice #: ${invoice.serial_number.formatted}<br>

Date: ${invoice.issue_date}

</div>

</div>

<table>

<thead>

<tr>

<th>المنتج</th>

<th>الكمية</th>

<th>السعر</th>

<th>الإجمالي</th>

</tr>

</thead>

<tbody>

${invoice.items
  .map(
    (item: any) => `
<tr>

<td>${item.variant.product_name}</td>

<td>${item.qty}</td>

<td>${(
      Number(item.price) / 1000
    ).toLocaleString()}</td>

<td>${(
      Number(item.line_total) /
      1000
    ).toLocaleString()}</td>

</tr>
`
  )
  .join("")}

</tbody>

</table>

<div class="total">

الإجمالي:
${total.toLocaleString()} IQD

</div>

<div class="footer">

شكراً لتعاملكم معنا

</div>

</body>

</html>
`;
  }
}