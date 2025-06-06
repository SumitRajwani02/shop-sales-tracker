// Fetch all sales markdown files from /sales/ and render them
async function loadSales() {
  // For simplicity, try to fetch a sales index. If not found, fallback to listing a few demo files.
  let files;
  try {
    const resp = await fetch('sales-index.json');
    files = await resp.json();
  } catch {
    // fallback: demo files or empty
    files = [];
  }
  let sales = [];
  for (const file of files) {
    try {
      const md = await fetch(file).then(r => r.text());
      const match = /^---([\s\S]+?)---/.exec(md);
      if (match) {
        const yaml = match[1];
        const s = {};
        yaml.split('\n').forEach(line => {
          const [k, ...v] = line.split(':');
          if (k && v) s[k.trim()] = v.join(':').trim().replace(/^"|"$/g, '');
        });
        sales.push(s);
      }
    } catch {}
  }
  window.salesData = sales;
  renderSales();
}
function renderSales() {
  const filter = document.getElementById('filter').value;
  const tbody = document.getElementById('sales-body');
  tbody.innerHTML = '';
  let now = new Date();
  let filtered = window.salesData.filter(sale => {
    let d = new Date(sale.date);
    if (filter === "today") return d.toDateString() === now.toDateString();
    if (filter === "week") {
      let weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      let weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return d >= weekStart && d <= weekEnd;
    }
    if (filter === "month") return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    return true;
  });
  for (const sale of filtered) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${sale.date}</td><td>${sale.product}</td><td>${sale.info}</td><td>${sale.price}</td><td>${sale.shop}</td>`;
    tbody.appendChild(tr);
  }
  window.filteredSales = filtered;
}
document.getElementById('filter').addEventListener('change', renderSales);
document.getElementById('download-csv').addEventListener('click', () => {
  const rows = [["Date","Product","Info","Price","Shop"]].concat(window.filteredSales.map(s => [s.date, s.product, s.info, s.price, s.shop]));
  let csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  let blob = new Blob([csv], {type: 'text/csv'});
  let a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'sales.csv';
  a.click();
});
document.getElementById('download-pdf').addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  let doc = new jsPDF();
  doc.text("Sales Report", 10, 10);
  let y = 20;
  for (const sale of window.filteredSales) {
    doc.text(`${sale.date} | ${sale.product} | ${sale.info} | ₹${sale.price} | ${sale.shop}`, 10, y);
    y += 10;
    if (y > 270) { doc.addPage(); y = 10; }
  }
  doc.save('sales.pdf');
});
window.addEventListener('DOMContentLoaded', loadSales);