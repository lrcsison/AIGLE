console.log("charts.js loaded");

/* ================================
   Utility Functions
================================ */
async function fetchJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`Error fetching ${url}:`, err);
    return [];
  }
}

/* ================================
   Bar Chart: Mostly Sold Items
================================ */
const ctxBar = document.getElementById("inventoryBarChart").getContext("2d");

const inventoryBarChart = new Chart(ctxBar, {
  type: "bar",
  data: {
    labels: [],
    datasets: [{
      label: "Units Sold",
      data: [],
      backgroundColor: [],
      borderColor: "#402218",
      borderWidth: 1
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: true, text: "Mostly Sold Items" },
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: "Units Sold" } },
      x: { title: { display: true, text: "Medicine" } }
    }
  }
});

async function updateBarchart() {
  const data = await fetchJSON("/api/charts/bar");
  console.log("Bar chart data:", data);
  if (!data.length) return;
  inventoryBarChart.data.labels = data.map(item => item.name);
  inventoryBarChart.data.datasets[0].data = data.map(item => item.total_sold);
  inventoryBarChart.data.datasets[0].backgroundColor = data.map(() => `#${Math.floor(Math.random()*16777215).toString(16)}`);
  inventoryBarChart.update();
}

/* ================================
   Line Chart: Inventory Usage
================================ */
const ctxLine = document.getElementById("inventoryLineChart").getContext("2d");

let inventoryLineChart;

async function initLineChart() {
  const data = await fetchJSON("/api/charts/line/inventory");
  console.log("Line chart data:", data);
  const labels = data.map(row => "Week " + row.week_num);
  const totals = data.map(row => row.total_usage);

  inventoryLineChart = new Chart(ctxLine, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Total Stocks",
        data: totals,
        borderColor: "#4CAF50",
        backgroundColor: "rgba(76, 175, 80, 0.2)",
        tension: 0.4,
        fill: true,
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { title: { display: true, text: "Overall Stocks per Week" } },
      onClick: (e, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          const weekLabel = inventoryLineChart.data.labels[index];
          const weekNum = parseInt(weekLabel.replace("Week ", ""));
          loadDonutData(weekNum);
        }
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: "Units Used" } },
        x: { title: { display: true, text: "Time Period" } }
      }
    }
  });
}

/* ================================
   Donut Chart: Breakdown by Medicine
================================ */
console.log("Donut chart JS loaded");

/* ================================
   Utility Functions
================================ */
async function fetchJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`Error fetching ${url}:`, err);
    return [];
  }
}

/* ================================
   Donut Chart Setup
================================ */
console.log("Donut chart JS loaded");

/* ================================
   Utility: Fetch JSON
================================ */
async function fetchJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`Error fetching ${url}:`, err);
    return [];
  }
}

/* ================================
   Chart Setup
================================ */
const ctxDonut = document.getElementById("inventoryDonutChart").getContext("2d");

const donutChart = new Chart(ctxDonut, {
  type: "doughnut",
  data: {
    labels: [],
    datasets: [{
      label: "Medicine Breakdown",
      data: [],
      backgroundColor: [],
      hoverOffset: 10
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "40%", // ✅ thicker donut
    radius: "90%",
    plugins: {
      title: {
        display: true,
        text: "Breakdown by Medicine"
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const value = context.raw;
            const perc = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${value} (${perc}%)`;
          }
        }
      },
      legend: {
        display: false
      }
    }
  }
});

/* ================================
   Scrollable Legend Renderer
================================ */
function createScrollableLegend(chart) {
  const legendContainer = chart.canvas.parentNode.querySelector(".donut-legend-js");
  if (!legendContainer) return;

  legendContainer.innerHTML = "";
  legendContainer.style.overflowY = "auto";
  legendContainer.style.maxHeight = "140px";
  legendContainer.style.marginTop = "10px";
  legendContainer.style.fontSize = "14px";
  legendContainer.style.paddingRight = "4px";

  chart.data.labels.forEach((label, i) => {
    const color = chart.data.datasets[0].backgroundColor[i];
    const value = chart.data.datasets[0].data[i];

    const item = document.createElement("div");
    item.style.display = "flex";
    item.style.alignItems = "center";
    item.style.justifyContent = "space-between";
    item.style.marginBottom = "4px";
    item.style.paddingBottom = "4px";
    item.style.borderBottom = "1px solid #ccc"; // ✅ divider

    const left = document.createElement("div");
    left.style.display = "flex";
    left.style.alignItems = "center";

    const box = document.createElement("span");
    box.style.width = "12px";
    box.style.height = "12px";
    box.style.backgroundColor = color;
    box.style.display = "inline-block";
    box.style.marginRight = "6px";
    box.style.borderRadius = "2px";

    left.appendChild(box);
    left.appendChild(document.createTextNode(label));

    const right = document.createElement("span");
    right.textContent = value;

    item.appendChild(left);
    item.appendChild(right);
    legendContainer.appendChild(item);
  });
}

/* ================================
   Load Donut Data
================================ */
async function loadDonutData(weekNum) {
  const rows = await fetchJSON(`/api/charts/donut/inventory/${weekNum}`);
  console.log(`Donut chart data for week ${weekNum}:`, rows);

  donutChart.data.labels = rows.map(r => r.item_name);
  donutChart.data.datasets[0].data = rows.map(r => r.quantity);
  donutChart.data.datasets[0].backgroundColor = rows.map(() =>
    `#${Math.floor(Math.random() * 16777215).toString(16)}`
  );

  donutChart.update();
  createScrollableLegend(donutChart);
}

/* ================================
   Initialize
================================ */
document.addEventListener("DOMContentLoaded", () => {
  loadDonutData(36); // default week
});


/* ================================
   Sales Line Chart: Weekly Sales
================================ */
let saleslineChart;

document.addEventListener("DOMContentLoaded", () => {
  // Sales line chart setup
  const ctxSalesLine = document.getElementById("salesLineChart").getContext("2d");

  saleslineChart = new Chart(ctxSalesLine, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: "Sales",
        data: [],
        borderColor: "#4CAF50",
        backgroundColor: "rgba(76,175,80,0.2)",
        tension: 0.4,
        pointRadius: 5
      }]
    },
    options: {
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        title: { display: true, text: "" }
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: "Units Sold" } },
        x: { title: { display: true, text: "Time Period" } }
      }
    }
  });

  // Initial load
  updateSalesChart("weekly");

  // Dropdown listener
  document.getElementById("timeframe").addEventListener("change", (e) => {
    const timeframe = e.target.value;
    updateSalesChart(timeframe);
  });
});

async function updateSalesChart(timeframe) {
  const titleMap = {
    weekly: "Week",
    monthly: "Month",
    quarterly: "Quarter",
    yearly: "Year"
  };

  try {
    const res = await fetch(`/api/charts/sales/${timeframe}`);
    const data = await res.json();
    console.log(`${timeframe} sales data:`, data);

    if (!data || !data.length) {
      console.warn("No sales data returned.");
      saleslineChart.data.labels = [];
      saleslineChart.data.datasets[0].data = [];
      saleslineChart.options.plugins.title.text = `Overall Sales per ${titleMap[timeframe]}`;
      saleslineChart.update();
      return;
    }

    const labels = data.map(d => d.period);
    const sales = data.map(d => d.sales);

    saleslineChart.data.labels = labels;
    saleslineChart.data.datasets[0].data = sales;
    saleslineChart.options.plugins.title.text = `Overall Sales per ${titleMap[timeframe]}`;
    saleslineChart.update();

    const titleEl = document.getElementById("salesChartTitle");
    if (titleEl) {
      titleEl.textContent = `Overall Sales per ${titleMap[timeframe]}`;
    }
  } catch (err) {
    console.error("Error loading sales chart:", err);
  }
}

/* ================================
   Initialization
================================ */
document.addEventListener("DOMContentLoaded", () => {
  updateBarchart();
  setInterval(updateBarchart, 15000);
  initLineChart();
  updateSalesChart();
  loadDonutData(36); // default week
});
