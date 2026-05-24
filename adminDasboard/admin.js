const API_URL = "http://localhost:3000/api";
const token = localStorage.getItem("adminToken");

// Fungsi Logout
function logout() {
  localStorage.removeItem("adminToken");
  window.location.href = "login.html";
}

// Fetch Data Pengurus
async function fetchPengurus() {
  const response = await fetch(`${API_URL}/pengurus`);
  const data = await response.json();
  const container = document.getElementById("pengurusControl");
  container.innerHTML = data
    .map(
      (p) => `
        <tr>
            <td>${p.p_nama}</td>
            <td>${p.p_id}</td>
            <td><button style="background:red">Hapus</button></td>
        </tr>
    `,
    )
    .join("");
}

// Simpan Pengurus
document
  .getElementById("addPengurusForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      p_id: document.getElementById("p_id").value,
      p_nama: document.getElementById("p_nama").value,
      p_sosmed: document.getElementById("p_sosmed").value,
      p_web: document.getElementById("p_web").value,
    };

    const response = await fetch(`${API_URL}/pengurus`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      alert("Data berhasil disimpan!");
      fetchPengurus();
    }
  });

// Fetch Pengaduan
async function fetchPengaduan() {
  const response = await fetch(`${API_URL}/pengaduan`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  const container = document.getElementById("pengaduanList");
  container.innerHTML = data
    .map(
      (ad) => `
        <div class="card">
            <strong>${ad.ad_subject}</strong> - ${ad.ad_identitas} (${ad.ad_nim})<br>
            <p>${ad.ad_description}</p>
            <small>${new Date(ad.created_at).toLocaleString()}</small>
        </div>
    `,
    )
    .join("");
}

// Load data awal
window.onload = () => {
  fetchPengurus();
  fetchPengaduan();
};
