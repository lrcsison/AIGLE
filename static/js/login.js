document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  const messageDiv = document.getElementById("message");

  if (data.success) {
    messageDiv.textContent = "Login successful! Redirecting...";
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 1000);
  } else {
    messageDiv.textContent = data.message || "Login failed.";
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
  }
});

// Clear fields when navigating back
window.addEventListener("pageshow", (event) => {
  if (
    event.persisted ||
    performance.getEntriesByType("navigation")[0].type === "back_forward"
  ) {
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
  }
});
