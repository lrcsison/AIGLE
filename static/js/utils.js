// utils.js
// ================================
// Dropdown Handling & Table Utilities
// ================================

// Show/hide dropdown menus
function setupDropdowns() {
  document.querySelectorAll(".more-options").forEach(icon => {
    icon.addEventListener("click", e => {
      e.stopPropagation();
      // support both .dropdown and .table-dropdown markup
      const dropdown = icon.closest(".dropdown, .table-dropdown");
      if (!dropdown) return;
      const menu = dropdown.querySelector(".dropdown-menu, .table-dropdown-menu");
      if (!menu) return;

      // hide other dropdowns (both variants)
      document.querySelectorAll(".dropdown-menu, .table-dropdown-menu").forEach(m => {
        if (m !== menu) m.classList.add("hidden");
      });

      menu.classList.toggle("hidden");
    });
  });

  // Hide dropdowns when clicking outside (cover both variants)
  window.addEventListener("click", () => {
    document.querySelectorAll(".dropdown-menu, .table-dropdown-menu").forEach(menu => menu.classList.add("hidden"));
  });
}

// Initialize dropdown action buttons
function setupDropdownActions() {
  document.querySelectorAll(".export-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      console.debug("utils.setupDropdownActions: export-btn clicked", btn);
      e.stopPropagation();
      const table = btn.closest(".info-table") ? btn.closest(".info-table").querySelector("table") : null;
      if (table) {
        try { exportTable(table); }
        catch(err){ console.error("exportTable error:", err); }
      } else {
        console.warn("export-btn clicked but no table found for", btn);
      }
    });
  });

  document.querySelectorAll(".view-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const table = btn.closest(".info-table").querySelector("table");
      if (table) viewTable(table);
    });
  });
}

// Export table to CSV
function exportTable(table) {
  const csv = [];
  for (let row of table.rows) {
    const cells = [...row.cells].map(cell => `"${cell.innerText}"`);
    csv.push(cells.join(","));
  }
  const blob = new Blob([csv.join("\n")], { type: "text/csv;charset=utf-8;" });
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${table.id}_export.csv`;
    document.body.appendChild(a);
    console.debug("exportTable: triggering download", a.download);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 150);
  } catch (err) {
    console.error("exportTable failed:", err);
    // expose blob for debugging in console
    window.__lastExportBlob = blob;
    throw err;
  }
}

// Placeholder for view action
function viewTable(table) {
  alert(`Viewing table: ${table.id}`);
}

// Fetch JSON helper
async function fetchJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Network response was not ok");
    return await res.json();
  } catch (err) {
    console.error("Fetch error:", err);
    return null;
  }
}

// Render table rows dynamically
function renderTable(selector, rows, emptyMessage, colSpan) {
  const tbody = document.querySelector(selector);
  tbody.innerHTML = rows.length
    ? rows.join("")
    : `<tr><td colspan="${colSpan}">${emptyMessage}</td></tr>`;
}

// ================================
// Table Sorting
// ================================
function makeTableSortable(table) {
  const headers = table.querySelectorAll("th");
  let currentSort = { index: null, asc: true };

  function sortTable(index, asc) {
    const tbody = table.querySelector("tbody");
    const rows = Array.from(tbody.querySelectorAll("tr"));

    rows.sort((a, b) => {
      let A = a.children[index].innerText.trim().toLowerCase();
      let B = b.children[index].innerText.trim().toLowerCase();
      const numA = parseFloat(A);
      const numB = parseFloat(B);
      if (!isNaN(numA) && !isNaN(numB)) {
        A = numA;
        B = numB;
      }
      if (A > B) return asc ? 1 : -1;
      if (A < B) return asc ? -1 : 1;
      return 0;
    });

    tbody.innerHTML = "";
    rows.forEach(row => tbody.appendChild(row));
  }

  headers.forEach((th, index) => {
    let icon = th.querySelector(".sort-icon");
    if (!icon) {
      icon = document.createElement("span");
      icon.className = "material-symbols-outlined sort-icon";
      icon.style.cssText = "font-size:16px; vertical-align:middle; margin-left:4px; display:none;";
      icon.textContent = "keyboard_arrow_down"; // default icon
      th.appendChild(icon);
    }

    th.addEventListener("click", () => {
      const currentlyAsc = th.classList.contains("asc");
      const asc = !currentlyAsc;
      th.classList.toggle("asc", asc);

      // Reset other headers
      headers.forEach(h => {
        if (h !== th) {
          h.classList.remove("asc");
          const otherIcon = h.querySelector(".sort-icon");
          if (otherIcon) otherIcon.style.display = "none";
        }
      });

      icon.style.display = "inline-block";
      icon.textContent = asc ? "keyboard_arrow_up" : "keyboard_arrow_down";

      currentSort = { index, asc };
      sortTable(index, asc);
    });
  });

  return {
    reapplySort() {
      if (currentSort.index !== null) sortTable(currentSort.index, currentSort.asc);
    }
  };
}

// ================================
// Search Highlighting
// ================================
function setupSearchHighlighter(inputSelector) {
  const input = document.querySelector(inputSelector);
  if (!input) return;

  input.addEventListener("input", () => {
    const searchTerm = input.value.toLowerCase();
    document.querySelectorAll("table tbody tr").forEach(row => {
      row.style.backgroundColor = row.innerText.toLowerCase().includes(searchTerm)
        ? "#ffff99"
        : "";
    });
  });
}

// ================================
// Export all functions
// ================================
export {
  setupDropdowns,
  setupDropdownActions,
  exportTable,
  viewTable,
  fetchJSON,
  renderTable,
  makeTableSortable,
  setupSearchHighlighter
};

// Auto-initialize dropdown actions when loaded in a browser
if (typeof window !== 'undefined') {
  try {
    document.addEventListener('DOMContentLoaded', () => {
      try { setupDropdowns(); } catch(e) {}
      try { setupDropdownActions(); } catch(e) {}
      // Expose exportTable for debugging
      try { window.exportTable = exportTable; } catch(e) {}
    });
  } catch(e) {
    /* ignore */
  }
}
