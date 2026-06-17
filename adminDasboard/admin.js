const API_URL = "http://localhost:3000/api";
const token = localStorage.getItem("adminToken");
const socket = typeof io !== "undefined" ? io("http://localhost:3000") : null;

// Inisialisasi Sinkronisasi Real-time
if (socket) {
  socket.on("update_berita", () => {
    const filter = document.getElementById("filterKategoriBerita")?.value || "";
    fetchBerita(filter);
  });
  socket.on("update_carousel", () => fetchCarouselControl());
  socket.on("update_dana", () => fetchDana());
  socket.on("update_buku", () => fetchBuku());
  socket.on("update_proker", () => fetchProker());
  socket.on("update_events", () => fetchEvents());
  socket.on("update_pengaduan", () => fetchPengaduan());
}

// Fungsi Logout
function logout() {
  localStorage.removeItem("adminToken");
  window.location.href = "login.html";
}

// Toast Notification System
function showToast(message, type = "success") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `hmi-toast ${type === "error" ? "error" : ""}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === "success" ? "Berhasil" : "Gagal"}</span>
    <span class="toast-msg">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 500);
  }, 4000);
}
async function addBerita(e) {
  e.preventDefault();
  const formData = new FormData();
  formData.append(
    "judul",
    document.querySelector("#addBeritaForm input[name='judul']").value,
  );
  formData.append(
    "konten",
    document.querySelector("#addBeritaForm textarea[name='konten']").value,
  );

  const bidangVal = document.getElementById("b_bidang").value;
  formData.append("bidang", bidangVal || "Umum");

  const fileInput = document.querySelector("#addBeritaForm input[type='file']")
    .files[0];
  if (fileInput) {
    formData.append("gambar", fileInput);
  }

  try {
    const response = await fetch(`${API_URL}/berita`, {
      method: "POST",
      headers: {
        // JANGAN set Content-Type di sini saat mengirim FormData
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (response.ok) {
      showToast("Berita berhasil diupload");
      e.target.reset(); // Sinyal socket akan memicu fetchBerita
    } else {
      if (response.status === 403 || response.status === 401) {
        showToast("Sesi berakhir, silakan login kembali", "error");
        logout();
        return;
      }
      let errorMessage = "Server Error";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        errorMessage = await response.text();
      }
      showToast(`Gagal: ${errorMessage}`, "error");
    }
  } catch (err) {
    showToast("Kesalahan jaringan saat upload", "error");
  }
}

async function fetchCarouselControl() {
  const container = document.getElementById("carouselControlList");
  const template = document.getElementById("carouselItemTemplate");
  if (!container) return;
  try {
    const response = await fetch(`${API_URL}/carousel`);
    const data = await response.json();
    const list = Array.isArray(data) ? data : data.data || [];

    container.innerHTML = "";
    if (list.length > 0) {
      list.forEach((item) => {
        const clone = template.content.cloneNode(true);
        clone.querySelector(".slide-title").textContent =
          item.judul || "Tanpa Judul";
        const btn = clone.querySelector(".btn-delete-carousel"); // Calls the standalone function
        btn.onclick = () => deleteCarousel(item.id);
        container.appendChild(clone);
      });
    }
  } catch (err) {
    console.error("Gagal load carousel:", err);
  }
}

async function deleteCarousel(id) {
  if (!confirm("Hapus slide carousel ini?")) return;
  const response = await fetch(
    `${API_URL}/carousel/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (response.ok) {
    showToast("Slide berhasil dihapus");
    fetchCarouselControl();
  }
}

async function addCarousel(e) {
  e.preventDefault();
  const formData = new FormData();
  formData.append("judul", document.getElementById("c_judul").value);
  const fileInput = document.getElementById("c_gambar").files[0];
  if (fileInput) formData.append("gambar", fileInput);

  const response = await fetch(`${API_URL}/carousel`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (response.ok) {
    showToast("Slide carousel ditambahkan");
    e.target.reset();
  } else if (response.status === 403 || response.status === 401) {
    showToast("Sesi berakhir", "error");
    logout();
  } else {
    showToast("Gagal menambah slide", "error");
  }
}

async function fetchBerita(bidang = "") {
  try {
    const container = document.getElementById("beritaControlList");
    const template = document.getElementById("tableRowTemplate");
    if (!container) return;

    container.innerHTML = '<tr><td colspan="3">Memuat...</td></tr>';

    let url = `${API_URL}/berita?limit=50`;
    if (bidang) {
      // Hanya tambahkan parameter bidang jika tidak kosong
      url += `&bidang=${bidang}`;
    }

    const response = await fetch(url);
    const result = await response.json();
    const data = result.data || [];

    container.innerHTML = "";
    data.forEach((b) => {
      // Pastikan data adalah array
      const clone = template.content.cloneNode(true);
      clone.querySelector(".col-nama").textContent = b.judul;
      clone.querySelector(".col-info").textContent = b.bidang || "Umum";
      const btn = clone.querySelector(".btn-delete");
      btn.className = "btn btn-sm btn-danger btn-delete";
      btn.onclick = () => deleteBerita(b.id);
      container.appendChild(clone);
    });
    if (data.length === 0)
      container.innerHTML =
        '<tr><td colspan="3">Tidak ada berita ditemukan.</td></tr>';
  } catch (err) {
    console.error("Gagal fetch berita:", err);
  }
}

// Listener untuk preview foto saat memilih file baru
document.getElementById("p_foto")?.addEventListener("change", (e) => {
  const file = e.target.files[0];
  const preview = document.getElementById("p_preview");
  if (file && preview) {
    preview.src = URL.createObjectURL(file); // Membuat URL sementara di memori browser
    preview.style.display = "block";
  }
});

// Simpan Pengurus
// Di dalam window.onload saja agar aman

// Fetch Berita with Filtering
async function deleteBerita(id) {
  if (!confirm("Yakin ingin menghapus berita ini?")) return;
  const response = await fetch(`${API_URL}/berita/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.ok) {
    showToast("Berita berhasil dihapus");
    fetchBerita();
  } else {
    showToast("Gagal menghapus berita", "error");
  }
}

// Fetch Pengaduan
async function fetchPengaduan() {
  try {
    const response = await fetch(`${API_URL}/pengaduan`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();
    const data = Array.isArray(result.data)
      ? result.data
      : Array.isArray(result)
        ? result
        : [];
    const container = document.getElementById("pengaduanList");
    const template = document.getElementById("pengaduanTemplate");

    container.innerHTML = "";
    data.forEach((ad) => {
      const clone = template.content.cloneNode(true);
      clone.querySelector(".subject").textContent = ad.subject;
      clone.querySelector(".identitas").textContent =
        `${ad.identitas} (${ad.nim})`;
      clone.querySelector(".description").textContent = ad.description;
      clone.querySelector(".timestamp").textContent = new Date(
        ad.created_at,
      ).toLocaleString();

      const btnDelete = clone.querySelector(".btn-delete-pengaduan");
      if (btnDelete) {
        btnDelete.onclick = () => deletePengaduan(ad.id);
      }

      container.appendChild(clone);
    });
  } catch (err) {
    console.error("Gagal fetch pengaduan:", err);
  }
}

async function deletePengaduan(id) {
  if (!confirm("Yakin ingin menghapus pengaduan ini?")) return;
  const response = await fetch(
    `${API_URL}/pengaduan/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (response.ok) {
    showToast("Pengaduan berhasil dihapus");
    fetchPengaduan(); // Tambahkan refresh data
  } else {
    showToast("Gagal menghapus pengaduan", "error");
    if (response.status === 403 || response.status === 401) {
      showToast("Sesi berakhir, silakan login kembali", "error");
      logout();
    } else if (response.status === 404) {
      showToast("Pengaduan tidak ditemukan", "error");
    } else {
      showToast(
        `Gagal menghapus pengaduan: ${response.statusText || "Terjadi kesalahan"}`,
        "error",
      );
    }
  }
}

async function fetchDana() {
  try {
    const response = await fetch(`${API_URL}/dana`);
    const result = await response.json();
    const data = result.data || [];
    const container = document.getElementById("danaList");
    if (container) {
      container.innerHTML = "";
      data.forEach((d) => {
        const div = document.createElement("div");
        div.className =
          "d-flex justify-content-between align-items-center p-2 mb-1 border rounded bg-white text-dark";
        const info = document.createElement("span");
        info.textContent = `${d.judul} - Rp${Number(d.amount || 0).toLocaleString("id-ID")}`;
        const btn = document.createElement("button");
        btn.className = "btn btn-sm btn-danger";
        btn.textContent = "Hapus";
        btn.onclick = () => deleteDana(d.id);
        div.append(info, btn);
        container.appendChild(div);
      });
    }
  } catch (err) {
    console.error("Gagal fetch dana:", err);
  }
}

async function addDana(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData();
  formData.append("judul", form.querySelector('[name="judul"]').value);
  formData.append("deskripsi", form.querySelector('[name="deskripsi"]').value);
  formData.append("amount", form.querySelector('[name="amount"]').value);
  const fileInput = form.querySelector('[name="file"]').files[0];
  if (fileInput) formData.append("file", fileInput);

  try {
    const response = await fetch(`${API_URL}/dana`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (response.ok) {
      showToast("Data Dana berhasil diupload");
      e.target.reset();
    } else if (response.status === 403 || response.status === 401) {
      showToast("Sesi berakhir", "error");
      logout();
    } else {
      showToast("Gagal upload Dana", "error");
    }
  } catch (err) {
    showToast("Kesalahan jaringan", "error");
  }
}

// Delete Dana
async function deleteDana(id) {
  if (!confirm("Hapus data dana ini?")) return;
  try {
    const response = await fetch(`${API_URL}/dana/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      showToast("Dana berhasil dihapus");
      fetchDana(); // Tambahkan refresh data
    } else if (response.status === 404) {
      showToast("Data dana tidak ditemukan", "error");
    } else if (response.status === 403 || response.status === 401) {
      showToast("Sesi berakhir, silakan login kembali", "error");
      logout();
    } else {
      let errorMessage = "Gagal menghapus dana";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        errorMessage = `Gagal menghapus dana: ${response.statusText}`;
      }
      showToast(errorMessage, "error");
    }
  } catch (err) {
    console.error("Network error during delete:", err);
    showToast("Kesalahan jaringan saat menghapus dana.", "error");
  }
}
async function fetchBuku() {
  try {
    const response = await fetch(`${API_URL}/buku`);
    const result = await response.json();
    const data = result.data || [];
    const container = document.getElementById("bukuList");
    if (container) {
      container.innerHTML = "";
      data.forEach((b) => {
        const div = document.createElement("div");
        div.className =
          "d-flex justify-content-between align-items-center p-2 mb-1 border rounded bg-white text-dark";

        const info = document.createElement("span");
        info.textContent = `${b.judul} (${b.penulis || "Tanpa Penulis"})`;

        const actions = document.createElement("div");
        actions.className = "d-flex gap-1";

        if (b.file_path) {
          actions.innerHTML += `<a href="http://localhost:3000${b.file_path}" target="_blank" class="btn btn-sm btn-info">Lihat</a>`;
        }

        const btn = document.createElement("button");
        btn.className = "btn btn-sm btn-danger";
        btn.textContent = "Hapus";
        btn.onclick = () => deleteBuku(b.id);

        actions.appendChild(btn);
        div.append(info, actions);
        container.appendChild(div);
      });
    }
  } catch (err) {
    console.error("Gagal fetch buku:", err);
  }
}

async function addBuku(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData();
  formData.append("judul", form.querySelector('[name="judul"]').value);
  formData.append("penulis", form.querySelector('[name="penulis"]').value);
  const fileInput = form.querySelector('[name="file"]').files[0];
  if (fileInput) formData.append("file", fileInput);

  try {
    const response = await fetch(`${API_URL}/buku`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (response.ok) {
      showToast("Buku berhasil diupload");
      e.target.reset();
    } else if (response.status === 403 || response.status === 401) {
      showToast("Sesi berakhir", "error");
      logout();
    } else {
      showToast("Gagal upload Buku", "error");
    }
  } catch (err) {
    showToast("Kesalahan jaringan", "error");
  }
}
async function deleteBuku(id) {
  if (!confirm("Hapus buku ini?")) return;
  const response = await fetch(`${API_URL}/buku/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.ok) {
    showToast("Buku berhasil dihapus");
    fetchBuku();
  } else showToast("Gagal menghapus buku", "error");
}

async function fetchProker() {
  try {
    const response = await fetch(`${API_URL}/proker`);
    const result = await response.json();
    const data = result.data || [];
    const container = document.getElementById("prokerList");
    if (container) {
      container.innerHTML = "";
      data.forEach((p) => {
        const div = document.createElement("div");
        div.className =
          "d-flex justify-content-between align-items-center p-2 mb-1 border rounded bg-white text-dark";

        const info = document.createElement("span");
        info.textContent = `${p.nama_proker} [${p.departemen_id}]`;

        const btn = document.createElement("button");
        btn.className = "btn btn-sm btn-danger";
        btn.textContent = "Hapus";
        btn.onclick = () => deleteProker(p.id);

        div.append(info, btn);
        container.appendChild(div);
      });
    }
  } catch (err) {
    console.error("Gagal fetch proker:", err);
  }
}

async function addProker(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData();
  formData.append(
    "nama_proker",
    form.querySelector('[name="nama_proker"]').value,
  );
  formData.append(
    "departemen_id",
    form.querySelector('[name="departemen_id"]').value,
  );
  formData.append("deskripsi", form.querySelector('[name="deskripsi"]').value);
  const fileInput = form.querySelector('[name="gambar"]').files[0];
  if (fileInput) formData.append("gambar", fileInput);

  try {
    const response = await fetch(`${API_URL}/proker`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (response.ok) {
      showToast("Proker berhasil diupload");
      e.target.reset();
    } else if (response.status === 403 || response.status === 401) {
      showToast("Sesi berakhir", "error");
      logout();
    } else {
      showToast("Gagal upload Proker", "error");
    }
  } catch (err) {
    showToast("Kesalahan jaringan", "error");
  }
}

async function fetchEvents() {
  const container = document.getElementById("eventList");
  const template = document.getElementById("eventTemplate");
  if (!container || !template) return;
  try {
    const response = await fetch(`${API_URL}/events`);
    const result = await response.json();
    const data = result.data || [];
    container.innerHTML = "";
    data.forEach((ev) => {
      const clone = template.content.cloneNode(true);
      clone.querySelector(".event-judul").textContent = ev.judul;
      clone.querySelector(".event-info").textContent = ev.lokasi;
      clone.querySelector(".event-tanggal").textContent = new Date(
        ev.tanggal,
      ).toLocaleDateString("id-ID");
      clone.querySelector(".btn-delete-event").onclick = () =>
        deleteEvent(ev.id);
      container.appendChild(clone);
    });
  } catch (err) {
    console.error("Gagal fetch events:", err);
  }
}

async function addEvent(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData();
  formData.append("judul", form.querySelector('[name="judul"]').value);
  formData.append("deskripsi", form.querySelector('[name="deskripsi"]').value);
  formData.append("tanggal", form.querySelector('[name="tanggal"]').value);
  formData.append("lokasi", form.querySelector('[name="lokasi"]').value);
  const fileInput = form.querySelector('[name="gambar"]').files[0];
  if (fileInput) formData.append("gambar", fileInput);

  try {
    const response = await fetch(`${API_URL}/events`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (response.ok) {
      showToast("Event berhasil ditambahkan");
      e.target.reset();
    } else {
      showToast("Gagal menambah event", "error");
    }
  } catch (err) {
    showToast("Kesalahan jaringan", "error");
  }
}

async function deleteEvent(id) {
  if (!confirm("Hapus event ini?")) return;
  try {
    const response = await fetch(
      `${API_URL}/events/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (response.ok) {
      showToast("Event berhasil dihapus");
      fetchEvents(); // Tambahkan refresh data
    } else {
      showToast("Gagal menghapus event", "error");
    }
  } catch (err) {
    showToast("Kesalahan jaringan", "error");
  }
}

async function deleteProker(id) {
  if (!confirm("Hapus proker ini?")) return;
  if (!token) {
    showToast("Sesi admin habis, silakan login ulang", "error");
    logout();
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/proker/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (response.ok) {
      showToast("Proker berhasil dihapus");
      fetchProker();
      return;
    }

    if (response.status === 404) {
      showToast("Proker tidak ditemukan", "error");
      return;
    }

    if (response.status === 403 || response.status === 401) {
      showToast("Sesi berakhir, silakan login kembali", "error");
      logout();
      return;
    }

    let errorMessage = "Gagal menghapus proker";
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (e) {
      errorMessage = `Gagal menghapus proker: ${response.statusText}`;
    }
    showToast(errorMessage, "error");
  } catch (err) {
    console.error("Network error during delete:", err);
    showToast("Kesalahan jaringan saat menghapus proker.", "error");
  }
}
// addPengaduan di admin.js dihapus karena form tidak ada di admin.html

document
  .getElementById("updateGrowthForm")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      bulan: document.getElementById("g_bulan").value,
      jumlah: document.getElementById("g_jumlah").value,
    };

    const response = await fetch(`${API_URL}/stats/growth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      showToast("Statistik diperbarui!");
      e.target.reset();
    } else {
      showToast("Gagal update statistik", "error");
    }
  });

// Load data awal
window.onload = async () => {
  // Bind Form Handlers
  // Dipindahkan ke atas agar tetap berjalan meskipun fetch data gagal
  if (document.getElementById("addBeritaForm"))
    document.getElementById("addBeritaForm").onsubmit = addBerita;
  if (document.getElementById("addCarouselForm"))
    document.getElementById("addCarouselForm").onsubmit = addCarousel;
  if (document.getElementById("addDanaForm"))
    document.getElementById("addDanaForm").onsubmit = addDana;
  if (document.getElementById("addBukuForm"))
    document.getElementById("addBukuForm").onsubmit = addBuku;
  if (document.getElementById("addProkerForm"))
    document.getElementById("addProkerForm").onsubmit = addProker;
  if (document.getElementById("addEventForm"))
    document.getElementById("addEventForm").onsubmit = addEvent;

  // Jalankan fetch data secara terpisah agar tidak saling mengunci
  fetchPengaduan();
  fetchBerita();
  fetchCarouselControl();
  fetchDana();
  fetchBuku();
  fetchProker();
  fetchEvents(); // Fetch events on load
};

// Event listener untuk filter kategori
document
  .getElementById("filterKategoriBerita")
  ?.addEventListener("change", (e) => {
    fetchBerita(e.target.value);
  });
