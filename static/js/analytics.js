const months = [
  { value: 1, label: "January" }, { value: 2, label: "February" }, { value: 3, label: "March" },
  { value: 4, label: "April" }, { value: 5, label: "May" }, { value: 6, label: "June" },
  { value: 7, label: "July" }, { value: 8, label: "August" }, { value: 9, label: "September" },
  { value: 10, label: "October" }, { value: 11, label: "November" }, { value: 12, label: "December" }
];

const quarters = [
  { value: "Q1", label: "Q1 (Jan-Mar)" }, { value: "Q2", label: "Q2 (Apr-Jun)" },
  { value: "Q3", label: "Q3 (Jul-Sep)" }, { value: "Q4", label: "Q4 (Oct-Dec)" }
];

function updateFilterOptions() {
  const period = document.getElementById("period").value;
  const selectorCol = document.getElementById("periodSelectorCol");
  const selector = document.getElementById("periodSelector");
  const label = document.getElementById("periodSelectorLabel");
  selector.innerHTML = "";

  switch (period) {
    case "yearly":
      selectorCol.style.display = "none";
      break;
    case "quarterly":
      selectorCol.style.display = "flex";
      label.textContent = "Quarter";
      quarters.forEach(q => {
        const o = document.createElement("option");
        o.value = q.value;
        o.textContent = q.label;
        if (q.value === "Q3") o.selected = true;
        selector.appendChild(o);
      });
      break;
    case "monthly":
      selectorCol.style.display = "flex";
      label.textContent = "Month";
      months.forEach(m => {
        const o = document.createElement("option");
        o.value = m.value;
        o.textContent = m.label;
        selector.appendChild(o);
      });
      break;
    case "weekly":
      selectorCol.style.display = "flex";
      label.textContent = "Week";
      for (let i = 0; i < 4; i++) {
        const o = document.createElement("option");
        o.value = i + 1;
        o.textContent = `Week ${i + 1}`;
        selector.appendChild(o);
      }
      break;
  }
}

function startDotAnimation(id) {
  const el = document.getElementById(id);
  if (!el) return;

  let step = 0;
  el.textContent = "Loading";
  const interval = setInterval(() => {
    step = (step + 1) % 4;
    el.textContent = "Loading" + ".".repeat(step);
  }, 500);

  el.dataset.intervalId = interval;
}

function stopDotAnimation(id) {
  const el = document.getElementById(id);
  if (el && el.dataset.intervalId) {
    clearInterval(el.dataset.intervalId);
    delete el.dataset.intervalId;
  }
}

function showLoading() {
  document.getElementById("most-used-body").innerHTML = `<tr><td colspan="2"><span class="loading-dots" id="loading-usage">Loading</span></td></tr>`;
  document.getElementById("least-used-body").innerHTML = `<tr><td colspan="2"><span class="loading-dots">Loading</span></td></tr>`;
  document.getElementById("recommendations-body").innerHTML = `<tr><td colspan="5"><span class="loading-dots" id="loading-recommendations">Loading</span></td></tr>`;

  startDotAnimation("loading-usage");
  startDotAnimation("loading-recommendations");
}

function updateAnalytics() {
  const period = document.getElementById("period").value;
  const year = document.getElementById("year").value || new Date().getFullYear();
  const periodSelector = document.getElementById("periodSelector");
  const periodValue = period === "yearly" ? "" : periodSelector.value;

  const params = new URLSearchParams({ period, year });
  if (periodValue) {
    if (period === "quarterly") params.append("quarter", periodValue);
    else if (period === "monthly") params.append("month", periodValue);
    else if (period === "weekly") params.append("week", periodValue);
  }

  showLoading();

  fetch(`/api/usage?${params.toString()}`)
    .then(res => res.ok ? res.json() : [])
    .then(updateUsageTables)
    .catch(err => {
      console.error("Usage fetch failed:", err);
      updateUsageTables([]);
    });

  fetch("/api/recommendations")
    .then(res => res.ok ? res.json() : [])
    .then(updateRecommendationsTable)
    .catch(err => {
      console.error("Recommendations fetch failed:", err);
      updateRecommendationsTable([]);
    });
}

function updateUsageTables(data) {
  stopDotAnimation("loading-usage");

  const mostUsedBody = document.getElementById("most-used-body");
  const leastUsedBody = document.getElementById("least-used-body");
  mostUsedBody.innerHTML = "";
  leastUsedBody.innerHTML = "";

  if (!data || data.length === 0) {
    mostUsedBody.innerHTML = `<tr><td colspan="2">No usage data available</td></tr>`;
    leastUsedBody.innerHTML = `<tr><td colspan="2">No usage data available</td></tr>`;
    return;
  }

  const sortedData = [...data].sort((a, b) => Math.abs(b.net_usage) - Math.abs(a.net_usage));
  const mostUsed = sortedData.slice(0, 3);
  const leastUsed = sortedData.slice(-3).reverse();

  mostUsed.forEach(i => {
    mostUsedBody.innerHTML += `<tr><td>${i.name}</td><td>${Math.abs(i.net_usage)}</td></tr>`;
  });
  leastUsed.forEach(i => {
    leastUsedBody.innerHTML += `<tr><td>${i.name}</td><td>${Math.abs(i.net_usage)}</td></tr>`;
  });
}

function updateRecommendationsTable(data) {
  stopDotAnimation("loading-recommendations");

  const tbody = document.getElementById("recommendations-body");
  tbody.innerHTML = "";

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">No recommendations available</td></tr>`;
    return;
  }

  data.forEach(item => {
    const statusClass = normalizeStatusClass(item.status);
    tbody.innerHTML += `
      <tr>
        <td>${item.name}</td>
        <td>${item.current_stock}</td>
        <td>${item.forecast_usage}</td>
        <td>${item.recommendation}</td>
        <td><span class="status-badge ${statusClass}">${item.status}</span></td>
      </tr>
    `;
  });

  const period = document.getElementById("period").value;
  const year = document.getElementById("year").value || new Date().getFullYear();
  const periodSelector = document.getElementById("periodSelector");
  let periodText = "";

  if (period === "yearly") periodText = `Year ${year}`;
  else if (period === "quarterly") periodText = `${periodSelector.value} ${year}`;
  else if (period === "monthly") {
    const monthLabel = months.find(m => m.value === parseInt(periodSelector.value))?.label;
    periodText = `${monthLabel} ${year}`;
  } else {
    periodText = `Week ${periodSelector.value} of ${year}`;
  }

  document.querySelector(".period-text").textContent = `Analysis for ${periodText}`;
}

function normalizeStatusClass(status) {
  if (!status) return 'status-unknown';
  const s = String(status).toLowerCase().trim();
  // Map common status text to class names
  if (s.includes('adequate') || s.includes('ok') || s.includes('in range')) return 'status-adequate';
  if (s.includes('overstock') || s.includes('excess') || s.includes('too many')) return 'status-overstock';
  if (s.includes('low')) return 'status-low';
  if (s.includes('out') || s.includes('out of stock')) return 'status-out-of-stock';
  if (s.includes('expir') || s.includes('expire')) return 'status-expiring';
  return 'status-unknown';
}

// Initialize
updateFilterOptions();
updateAnalytics();
document.getElementById("period").addEventListener("change", () => {
  updateFilterOptions();
  updateAnalytics();
});
