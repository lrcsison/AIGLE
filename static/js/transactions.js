document.addEventListener("DOMContentLoaded", () => {
  updateTransactions();
  setInterval(updateTransactions, 5000);

  const typeSelect = document.getElementById("asType");
  if (typeSelect) typeSelect.addEventListener("change", updateTransactions);

  const txTable = document.getElementById("transactionsTable");
  if (txTable) makeTableSortable(txTable);
});

async function updateTransactions() {
  const type = document.getElementById("asType")?.value || "all";
  const data = await fetchJSON(`/api/transactions?type=${type}`);
  if (!data || !data.length) {
    renderTable("#transactionsBody", [], "No transactions available", 8);
    return;
  }

  const rows = data.map(t => {
    const total = (t.price && t.quantity) ? (t.price * t.quantity).toFixed(2) : "0.00";
    return `<tr>
      <td>${t.transaction_type || ""}</td>
      <td>${t.item_name || ""}</td>
      <td>${t.quantity || 0}</td>
      <td>${parseFloat(t.price || 0).toFixed(2)}</td>
      <td>${t.transaction_date || ""}</td>
      <td>${total}</td>
      <td>${t.employee_id || ""}</td>
      <td>${t.remarks || ""}</td>
    </tr>`;
  });

  renderTable("#transactionsBody", rows, "No transactions available", 8);

  const table = document.getElementById("transactionsTable");
  if (table && table._sortState) {
    applyTableSort(table, table._sortState.col, table._sortState.dir);
    updateSortIndicators(table, table._sortState.col, table._sortState.dir);
  }
}

// ---------- Utility Functions ----------
async function fetchJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
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

// ---------- Sortable Table ----------
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
