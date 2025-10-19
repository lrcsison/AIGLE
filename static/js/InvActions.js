document.addEventListener("DOMContentLoaded", () => {
  const supabase = window.supabase.createClient(
    "https://xqcvwnimuldnehgciivo.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxY3Z3bmltdWxkbmVoZ2NpaXZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjE0ODg5NCwiZXhwIjoyMDcxNzI0ODk0fQ.yPAQdjX7dNKaoe6AzVqh6YGCJxj0OSULO9q45lm6Gjg"
  );

  const table = document.getElementById("invTable");
  const tableBody = table ? table.querySelector("tbody") : null;
  let editMode = false;

  // Dropdown toggle (supports table-dropdown)
  document.querySelectorAll(".more-options").forEach(icon => {
    icon.addEventListener("click", e => {
      e.stopPropagation();
      const dropdown = icon.closest(".dropdown, .table-dropdown");
      if (!dropdown) return;
      const menu = dropdown.querySelector(".dropdown-menu, .table-dropdown-menu");
      if (!menu) return;
      document.querySelectorAll(".dropdown-menu, .table-dropdown-menu").forEach(m => { if(m !== menu) m.classList.add("hidden"); });
      menu.classList.toggle("hidden");
    });
  });
  window.addEventListener("click", () => document.querySelectorAll(".dropdown-menu, .table-dropdown-menu").forEach(m=>m.classList.add("hidden")));

  // Open Add modal
  const addBtn = document.querySelector(".add-btn");
  const cancelAdd = document.getElementById("cancelAdd");
  const applyAdd = document.getElementById("applyAdd");
  if (addBtn) addBtn.addEventListener("click", () => document.getElementById("addItemModal").classList.remove("hidden"));
  if (cancelAdd) cancelAdd.addEventListener("click", () => document.getElementById("addItemModal").classList.add("hidden"));

  if (applyAdd) {
    applyAdd.addEventListener("click", async () => {
      const item = {
        medicine_id: parseInt(document.getElementById("itemMedicineId").value),
        name: document.getElementById("itemName").value.trim(),
        description: document.getElementById("itemDescription").value.trim(),
        lot_no: document.getElementById("itemLotNo").value.trim(),
        storage_location: document.getElementById("itemLocation").value.trim(),
        unit: document.getElementById("itemUnit").value.trim(),
        quantity: parseInt(document.getElementById("itemQty").value),
        expiry_date: document.getElementById("itemExpiry").value,
        manufacturer_id: document.getElementById("itemManufacturerId").value ? parseInt(document.getElementById("itemManufacturerId").value) : null,
        supplier_id: document.getElementById("itemSupplierId").value ? parseInt(document.getElementById("itemSupplierId").value) : null,
        is_deleted: false,
        synced: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      };

      if (!item.medicine_id || !item.name || !item.description || !item.lot_no || !item.storage_location || !item.unit || isNaN(item.quantity) || !item.expiry_date) {
        alert("Please fill all required fields");
        return;
      }

      const { error } = await supabase.from("medicines").insert([item]);
      if (error) alert("Add failed: " + error.message);
      else {
        alert("Item added successfully");
        document.getElementById("addItemModal").classList.add("hidden");
        ["itemMedicineId","itemName","itemDescription","itemLotNo","itemLocation","itemUnit","itemQty","itemExpiry","itemManufacturerId","itemSupplierId"].forEach(id=>{ const el=document.getElementById(id); if(el) el.value = ""; });
        loadInventory();
      }
    });
  }

  // Toggle edit mode
  const editBtn = document.querySelector(".edit-btn");
  if (editBtn) editBtn.addEventListener("click", () => { editMode = true; alert("Edit mode activated. Click a row to edit, then use the save button."); loadInventory(); });

  // Load inventory and render rows
  async function loadInventory() {
    if (!tableBody) return;
    const { data, error } = await supabase.from("medicines").select("*").order("medicine_id", { ascending: true });
    if (error) { tableBody.innerHTML = `<tr><td colspan="6">Error: ${error.message}</td></tr>`; return; }
    if (!data || !data.length) { tableBody.innerHTML = `<tr><td colspan="6">No inventory found</td></tr>`; return; }

    tableBody.innerHTML = "";
    data.forEach(item => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td data-medicine-id="${item.medicine_id}">${item.name}</td>
        <td>${item.quantity}</td>
        <td>${item.lot_no}</td>
        <td>${item.storage_location}</td>
        <td>${item.supplier_id || ''}</td>
        <td>${item.expiry_date}</td>
      `;

      if (editMode) {
        tr.classList.add("editable-row");

        // Save icon
        const saveIcon = document.createElement("span");
        saveIcon.className = "material-icons save-icon";
        saveIcon.textContent = "save";
        saveIcon.style.marginLeft = "8px";
        saveIcon.style.cursor = "pointer";
        tr.appendChild(saveIcon);

        saveIcon.addEventListener("click", async () => {
          const updatedItem = {
            name: tr.cells[0].innerText,
            quantity: parseInt(tr.cells[1].innerText),
            lot_no: tr.cells[2].innerText,
            storage_location: tr.cells[3].innerText,
            supplier_id: tr.cells[4].innerText || null,
            expiry_date: tr.cells[5].innerText
          };
          const medicineId = parseInt(tr.cells[0].dataset.medicineId);
          const { error } = await supabase.from("medicines").update(updatedItem).eq("medicine_id", medicineId);
          if (error) alert("Update failed: " + error.message);
          else { alert("Item updated successfully!"); editMode = false; loadInventory(); }
        });

        // Delete icon
        const deleteIcon = document.createElement("span");
        deleteIcon.className = "material-icons delete-icon";
        deleteIcon.textContent = "delete";
        deleteIcon.style.marginLeft = "8px";
        deleteIcon.style.cursor = "pointer";
        tr.appendChild(deleteIcon);

        deleteIcon.addEventListener("click", async () => {
          if (confirm(`Delete item "${item.name}"?`)) {
            const { error } = await supabase.from("medicines").delete().eq("medicine_id", item.medicine_id);
            if (error) alert("Delete failed: " + error.message);
            else { alert("Item deleted successfully!"); editMode = false; loadInventory(); }
          }
        });
      }

      tableBody.appendChild(tr);
    });
  }

  // Row click for editing highlight
  if (table) {
    table.addEventListener("click", e => {
      if (!editMode) return;
      const row = e.target.closest("tr");
      if (!row || row.parentElement.tagName === "THEAD") return;
      row.querySelectorAll("td").forEach(td => td.contentEditable = true);
      row.style.backgroundColor = "#e0f7e9";
    });
  }

  // Initial load
  loadInventory();
});