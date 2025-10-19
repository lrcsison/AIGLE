document.addEventListener("DOMContentLoaded", () => {
  updateInventoryCard();    // update the dashboard widget
  updateInventoryTable();   // update the full inventory table

  setInterval(updateInventoryCard, 5000); // refresh every 5s
  setInterval(updateInventoryTable, 5000);

  // Inventory filter for table
  const statusSelect = document.getElementById("asStatus");
  if (statusSelect) {
    statusSelect.addEventListener("change", updateInventoryTable);
  }

  // Make inventory table sortable
  const invTable = document.getElementById("invTable");
  if (invTable) makeTableSortable(invTable);
});

// ------------------- Dashboard Card -------------------
async function updateInventoryCard() {
  const data = await fetchJSON("/api/inventory") || [];

  const today = new Date();
  const in30Days = new Date();
  in30Days.setDate(today.getDate() + 30);

  const total = data.length;
  const low = data.filter(m => m.quantity > 0 && m.quantity <= 5).length;
  const out = data.filter(m => m.quantity === 0).length;
  const expiring = data.filter(m => {
    if (!m.expiry_date) return false;
    const expiry = new Date(m.expiry_date);
    return expiry >= today && expiry <= in30Days;
  }).length;

  // Fixed-size card: inventory widget
  const card = document.getElementById("inventoryCard");
  if (card) {
    card.style.width = "300px";
    card.style.height = "180px";
    card.innerHTML = `
      <h3>Inventory Summary</h3>
      <div class="card-item">Total Items: <b>${total}</b></div>
      <div class="card-item">Low Stock: <b>${low}</b></div>
      <div class="card-item">Out of Stock: <b>${out}</b></div>
      <div class="card-item">Expiring Soon: <b>${expiring}</b></div>
    `;
  }
}

// ------------------- Inventory Table -------------------
async function updateInventoryTable() {
  const status = document.getElementById("asStatus")?.value || "all";

  const data = await fetchJSON(`/api/inventory?type=${status}`);
  if (!data) return;

  // Always render only 6 columns (no actions)
  const rows = data.map(item => {
    return `<tr>
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>${item.lot_no}</td>
      <td>${item.storage_location}</td>
      <td>${item.supplier_id}</td>
      <td>${item.expiry_date}</td>
    </tr>`;
  });

  const emptyMsg = status === "low_stock" || status === "out_of_stock"
    ? "All stocks are sufficient ✅"
    : status === "expired"
    ? "No expired products 🎉"
    : "No products found ❌";

  // colspan = 6, since we have 6 headers now
  renderTable("#invTable tbody", rows, emptyMsg, 6);

  const table = document.getElementById("invTable");
  if (table && table._sortState) {
    applyTableSort(table, table._sortState.col, table._sortState.dir);
    updateSortIndicators(table, table._sortState.col, table._sortState.dir);
  }
}


// ------------------- Helpers -------------------
async function fetchJSON(url) {
  try {
    const res = await fetch(url);
    return await res.json();
  } catch (err) {
    console.error(`Error fetching ${url}:`, err);
    return [];
  }
}

function renderTable(tbodySelector, rowsHtml, emptyMsg, colspan) {
  const tbody = document.querySelector(tbodySelector);
  tbody.innerHTML = rowsHtml.length ? rowsHtml.join("") :
    `<tr><td colspan="${colspan}">${emptyMsg}</td></tr>`;
}

// ------------------- Sortable Table -------------------
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
}

function applyTableSort(table, colIdx, dir) {
  const tbody = table.tBodies[0];
  const rows = Array.from(tbody.rows);

  const isDate = rows.some(r => !isNaN(Date.parse(r.cells[colIdx].textContent)));
  const isNumeric = rows.every(r => !isNaN(r.cells[colIdx].textContent));

  rows.sort((a, b) => {
    let aText = a.cells[colIdx].textContent.trim();
    let bText = b.cells[colIdx].textContent.trim();

    if (isDate) { aText = new Date(aText); bText = new Date(bText); }
    else if (isNumeric) { aText = parseFloat(aText); bText = parseFloat(bText); }

    if (aText < bText) return dir === "asc" ? -1 : 1;
    if (aText > bText) return dir === "asc" ? 1 : -1;
    return 0;
  });

  rows.forEach(r => tbody.appendChild(r));
}

function updateSortIndicators(table, colIdx, dir) {
  table.querySelectorAll("thead th").forEach((th, idx) => {
    th.textContent = th.textContent.replace(/\s*[▲▼]$/, "");
    if (idx === colIdx) th.textContent += dir === "asc" ? " ▲" : " ▼";
  });
}
