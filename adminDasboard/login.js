document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  // Pastikan URL backend sesuai dengan port di server.js Anda
  try {
    const response = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (data.success) {
      localStorage.setItem("adminToken", data.token);
      window.location.href = "../adminDasboard/admin.html";
    } else {
      document.getElementById("errorMessage").style.display = "block";
    }
  } catch (error) {
    console.error("Login fetch error:", error);
    alert("Gagal terhubung ke server!");
  }
});
