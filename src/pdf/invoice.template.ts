export class InvoiceTemplate {
  static render(invoice: any) {
    return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">

<head>

<meta charset="utf-8">

<link
href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap"
rel="stylesheet">

<style>

body{
font-family:'Cairo',sans-serif;
padding:40px;
direction:rtl;
}

table{
width:100%;
border-collapse:collapse;
}

th,td{
border:1px solid #ddd;
padding:10px;
text-align:right;
}

th{
background:#f5f5f5;
}

</style>

</head>

<body>

<h1>شركة خيارات العبدالله للتوزيع</h1>

<p>${invoice.client_name}</p>

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
<td>${item.variant.product_name.replace(/^\*/, "")}</td>
<td>${item.qty}</td>
<td>${(item.price / 1000).toLocaleString()}</td>
<td>${(item.line_total / 1000).toLocaleString()}</td>
</tr>`
  )
  .join("")}

</tbody>

</table>

</body>

</html>
`;
  }
}