// -----------------------------
// Dashboard Cards Info
// -----------------------------
async function updateCardsInfo() {
  try {
    const response = await fetch("/api/inventory/summary");
    const data = await response.json();

    document.getElementById("totalItems").textContent = data.total_items ?? 0;
    document.getElementById("lowStock").textContent = data.low_stock ?? 0;
    document.getElementById("outofStock").textContent = data.out_of_stock ?? 0;
    document.getElementById("expiringSoon").textContent = data.expiring_soon ?? 0;

  } catch (err) {
    console.error("Error fetching inventory summary:", err);
  }
}

// Update cards on page load
document.addEventListener("DOMContentLoaded", () => {
  updateCardsInfo();
  setInterval(updateCardsInfo, 15000); // refresh every 15 seconds
});
