document.addEventListener("DOMContentLoaded", () => {
  const isEmployeesPage = window.location.pathname.includes("/employees");

  if (isEmployeesPage) {
    // Full employees page
    updateEmployeeTableFull();
    setInterval(updateEmployeeTableFull, 5000);

    const statusSelect = document.getElementById("asType");
    if (statusSelect) statusSelect.addEventListener("change", updateEmployeeTableFull);

    const empTable = document.getElementById("empPerfTable");
    if (empTable) makeTableSortable(empTable);

  } else {
    // Dashboard compact view
    updateEmployeeTableDashboard();
    setInterval(updateEmployeeTableDashboard, 5000);

    const empTable = document.getElementById("empPerfTable");
    if (empTable) makeTableSortable(empTable);
  }
});

// ---------- Full Employees Page ----------
async function updateEmployeeTableFull() {
  const status = document.getElementById("asType")?.value || "all";
  const data = await fetchJSON(`/api/employees?status=${status}`);
  if (!data) return;

  const rows = data.map(emp => {
    return `<tr>
      <td>${emp.name}</td>
      <td>${emp.position}</td>
      <td>${emp.contact_info || "-"}</td>
      <td>${emp.address || "-"}</td>
      <td>${emp.is_active ? "Active" : "Inactive"}</td>
      <td>${emp.remarks || "-"}</td>
      <td>${emp.rating !== null ? Number(emp.rating).toFixed(2) : "-"}</td>
    </tr>`;
  });

  renderTable("#empPerfTable tbody", rows, "No employees found ❌", 7);

  const table = document.getElementById("empPerfTable");
  if (table && table._sortState) {
    applyTableSort(table, table._sortState.col, table._sortState.dir);
    updateSortIndicators(table, table._sortState.col, table._sortState.dir);
  }
}

// ---------- Dashboard Compact Table ----------
async function updateEmployeeTableDashboard() {
  const data = await fetchJSON("/api/employees?limit=5"); // compact
  if (!data) return;

  const rows = data.map(emp => {
    return `<tr>
      <td>${emp.name}</td>
      <td>${emp.position}</td>
      <td>${emp.remarks}</td>
      <td>${emp.rating !== null ? Number(emp.rating).toFixed(2) : "-"}</td>
    </tr>`;
  });

  renderTable("#empPerfTable tbody", rows, "No employee data available", 4);

  const table = document.getElementById("empPerfTable");
  if (table && table._sortState) {
    applyTableSort(table, table._sortState.col, table._sortState.dir);
    updateSortIndicators(table, table._sortState.col, table._sortState.dir);
  }
}

// ---------- Helpers ----------
async function fetchJSON(url) {
  try { const res = await fetch(url); return await res.json(); }
  catch (err) { console.error(`Error fetching ${url}:`, err); return []; }
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
