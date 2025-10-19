document.addEventListener("DOMContentLoaded", () => {
  updateTopSales();

  setInterval(updateTopSales, 5000);

  const topsalesTable = document.getElementById("topSalesTable");
  if (topsalesTable) {
    window.topsalesSorter = makeTableSortable(topsalesTable);
  }
});

async function updateTopSales() {
  const data = await fetchJSON("/api/top-sales");
  if (!data || !Array.isArray(data) || data.length === 0) return;

  console.log("Top sales data:", data);

  const rows = data.map(item => `
    <tr>
      <td>${item.item_name}</td>
      <td>${item.total_units_sold}</td>
      <td>${item.total_revenue !== undefined ? parseFloat(item.total_revenue).toFixed(2) : "N/A"}</td>
    </tr>
  `);

  renderTable("#topSalesTable tbody", rows, "No sales data available", 3);

  if (window.topsalesSorter) {
    window.topsalesSorter.reapplySort();
  }
}
