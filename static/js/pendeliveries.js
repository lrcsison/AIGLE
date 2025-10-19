document.addEventListener("DOMContentLoaded", () => {
  updateDeliveries();
  setInterval(updateDeliveries, 5000);

  // Make Deliveries Table Sortable
  const deliveriesTable = document.getElementById("deliveriesTable");
  if (deliveriesTable) {
    window.deliveriesSorter = makeTableSortable(deliveriesTable);
  }
});

async function updateDeliveries() {
  const data = await fetchJSON("/api/deliveries") || [];
  const tbody = document.querySelector("#deliveriesTable tbody");
  if (!tbody) return;

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="5">No deliveries at the moment</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(delivery => `
    <tr>
      <td>${delivery.status}</td>
      <td>${delivery.supplier}</td>
      <td>${delivery.product}</td>
      <td>${delivery.quantity}</td>
      <td>${delivery.est_delivery || "-"}</td>
    </tr>
  `).join("");

  // Reapply sort
  if (window.deliveriesSorter) {
    window.deliveriesSorter.reapplySort();
  }
}

// Simple fetch helper
async function fetchJSON(url) {
  try {
    const res = await fetch(url);
    return await res.json();
  } catch (err) {
    console.error(`Error fetching ${url}:`, err);
    return [];
  }
}

// Sort helper (reusable)
function makeTableSortable(table) {
  const ths = table.querySelectorAll("thead th");
  ths.forEach((th, colIdx) => {
    th.style.cursor = "pointer";
    th.addEventListener("click", () => {
      let dir = "asc";
      if (table._sortState && table._sortState.col === colIdx) {
        dir = table._sortState.dir === "asc" ? "desc" : "asc";
      }
      applyTableSort(table, colIdx, dir);
      table._sortState = { col: colIdx, dir };
      updateSortIndicators(table, colIdx, dir);
    });
  });
  return {
    reapplySort: () => {
      if (table._sortState) applyTableSort(table, table._sortState.col, table._sortState.dir);
    }
  };
}

function applyTableSort(table, colIdx, dir) {
  const tbody = table.tBodies[0];
  const rows = Array.from(tbody.rows);
  const isNumeric = rows.every(row => !isNaN(row.cells[colIdx].textContent.trim()));
  const isDate = rows.some(row => !isNaN(Date.parse(row.cells[colIdx].textContent.trim())));

  rows.sort((a, b) => {
    let aText = a.cells[colIdx].textContent.trim();
    let bText = b.cells[colIdx].textContent.trim();
    if (isDate) { aText = new Date(aText); bText = new Date(bText); }
    else if (isNumeric) { aText = parseFloat(aText); bText = parseFloat(bText); }
    if (aText < bText) return dir === "asc" ? -1 : 1;
    if (aText > bText) return dir === "asc" ? 1 : -1;
    return 0;
  });

  rows.forEach(row => tbody.appendChild(row));
}

function updateSortIndicators(table, colIdx, dir) {
  const ths = table.querySelectorAll("thead th");
  ths.forEach((th, idx) => {
    th.textContent = th.textContent.replace(/\s*[▲▼]$/, "");
    if (idx === colIdx) th.textContent += dir === "asc" ? " ▲" : " ▼";
  });
}
