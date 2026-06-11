const API_URL = "http://localhost:3000/api";
const token = localStorage.getItem("adminToken");
let editingPengurusId = null;

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

// Fetch Data Pengurus
async function fetchPengurus() {
  try {
    const container = document.getElementById("pengurusControl");
    const template = document.getElementById("tableRowTemplate");
    const loaderTemplate = document.getElementById("loaderTemplate");

    container.innerHTML = '<tr><td colspan="3" class="text-center"></td></tr>';
    container
      .querySelector("td")
      .appendChild(loaderTemplate.content.cloneNode(true));

    const response = await fetch(`${API_URL}/pengurus`);
    const result = await response.json();
    const data = Array.isArray(result.data)
      ? result.data
      : Array.isArray(result)
        ? result
        : [];

    container.innerHTML = "";
    data.forEach((p) => {
      const clone = template.content.cloneNode(true);
      clone.querySelector(".col-nama").textContent = p.nama || "Tanpa Nama";
      clone.querySelector(".col-info").textContent = p.id || "-";
      const btn = clone.querySelector(".btn-delete");

      const btnEdit = clone.querySelector(".btn-edit");
      if (btnEdit) btnEdit.onclick = () => prepareEditPengurus(p);

      btn.className = "btn btn-sm btn-danger";
      btn.onclick = () => deletePengurus(p.id);
      container.appendChild(clone);
    });
  } catch (err) {
    console.error("Gagal fetch pengurus:", err);
    showToast("Gagal memuat data pengurus", "error");
  }
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

  formData.append(
    "gambar",
    document.querySelector("#addBeritaForm input[type='file']").files[0],
  );

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
      e.target.reset();
      fetchBerita();
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

    container.innerHTML = "";
    if (Array.isArray(data)) {
      data.forEach((item) => {
        const clone = template.content.cloneNode(true);
        clone.querySelector(".slide-title").textContent =
          item.judul || "Tanpa Judul";
        const btn = clone.querySelector(".btn-delete-carousel");
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
  const response = await fetch(`${API_URL}/carousel/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.ok) {
    showToast("Slide berhasil dihapus");
    fetchCarouselControl();
  }
}

async function addCarousel(e) {
  e.preventDefault();
  const formData = new FormData();
  formData.append("judul", document.getElementById("c_judul").value);
  formData.append("gambar", document.getElementById("c_gambar").files[0]);

  const response = await fetch(`${API_URL}/carousel`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (response.ok) {
    showToast("Slide carousel ditambahkan");
    e.target.reset();
    fetchCarouselControl();
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

    container.innerHTML = "<tr><td colspan='3'>Memuat...</td></tr>";

    const response = await fetch(`${API_URL}/berita?limit=50&bidang=${bidang}`);
    const result = await response.json();
    const data = result.data || [];

    container.innerHTML = "";
    data.forEach((b) => {
      const clone = template.content.cloneNode(true);
      clone.querySelector(".col-nama").textContent = b.judul;
      clone.querySelector(".col-info").textContent = b.bidang || "Umum";
      const btn = clone.querySelector(".btn-delete");
      btn.className = "btn btn-sm btn-danger";
      btn.onclick = () => deleteBerita(b.id);
      container.appendChild(clone);
    });
  } catch (err) {
    console.error("Gagal fetch berita:", err);
  }
}

function prepareEditPengurus(p) {
  editingPengurusId = p.id || p.p_id;
  document.getElementById("p_id").value = p.id || p.p_id;
  document.getElementById("p_nama").value = p.nama || p.p_nama;
  document.getElementById("p_jabatan").value = p.jabatan || "";
  document.getElementById("p_sosmed").value = p.sosmed || "";
  document.getElementById("p_web").value = p.web || "";

  // Tampilkan preview foto yang sudah ada di database saat edit
  const preview = document.getElementById("p_preview");
  if (p.foto_path) {
    preview.src = `http://localhost:3000${p.foto_path}`;
    preview.style.display = "block";
  }

  document.getElementById("pengurusFormTitle").innerText = "Edit Pengurus";
  document.getElementById("btnSubmitPengurus").innerText = "Update Pengurus";
  document.getElementById("btnCancelPengurus").style.display = "block";

  window.scrollTo({
    top: document.getElementById("addPengurusForm").offsetTop - 100,
    behavior: "smooth",
  });
}

function resetPengurusForm() {
  editingPengurusId = null;
  document.getElementById("addPengurusForm").reset();
  // Reset preview gambar
  const preview = document.getElementById("p_preview");
  if (preview) {
    preview.src = "";
    preview.style.display = "none";
  }

  document.getElementById("pengurusFormTitle").innerText = "Tambah Pengurus";
  document.getElementById("btnSubmitPengurus").innerText = "Simpan Pengurus";
  document.getElementById("btnCancelPengurus").style.display = "none";
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

document
  .getElementById("btnCancelPengurus")
  ?.addEventListener("click", resetPengurusForm);

async function deletePengurus(id) {
  if (!confirm("Yakin ingin menghapus pengurus ini?")) return;
  const response = await fetch(`${API_URL}/pengurus/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.ok) {
    showToast("Data pengurus berhasil dihapus");
    fetchPengurus();
  } else {
    showToast("Gagal menghapus data", "error");
  }
}

// Simpan Pengurus
document
  .getElementById("addPengurusForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerText = "Menyimpan...";

    const formData = new FormData();
    formData.append("id", document.getElementById("p_id").value);
    formData.append("nama", document.getElementById("p_nama").value);
    formData.append("jabatan", document.getElementById("p_jabatan").value);
    formData.append("sosmed", document.getElementById("p_sosmed").value);
    formData.append("web", document.getElementById("p_web").value);
    formData.append("id_order", 0);
    formData.append("foto", document.getElementById("p_foto").files[0]);

    const url = editingPengurusId
      ? `${API_URL}/pengurus/${editingPengurusId}`
      : `${API_URL}/pengurus`;
    const method = editingPengurusId ? "PUT" : "POST";

    const response = await fetch(url, {
      method: method,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (response.ok) {
      showToast(editingPengurusId ? "Data diperbarui!" : "Data disimpan!");
      resetPengurusForm();
      fetchPengurus();
    } else {
      if (response.status === 403 || response.status === 401) {
        showToast("Sesi berakhir, silakan login kembali", "error");
        logout();
        return;
      }
      let errorMessage = "Server Error";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        errorMessage = await response.text();
      }
      showToast(`Gagal: ${errorMessage}`, "error");
    }
    submitBtn.disabled = false;
    submitBtn.innerText = "Simpan Pengurus";
  });

// Fetch Berita with Filtering
async function deleteBerita(id) {
  if (!confirm("Yakin ingin menghapus berita ini?")) return;
  const response = await fetch(`${API_URL}/berita/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.ok) {
    showToast("Berita berhasil dihapus");
    fetchBerita(document.getElementById("filterKategoriBerita")?.value || "");
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
      container.appendChild(clone);
    });
  } catch (err) {
    console.error("Gagal fetch pengaduan:", err);
  }
}

async function fetchDana() {
  try {
    const response = await fetch(`${API_URL}/dana`);
    const result = await response.json();
    const data = result.data || [];
    const container = document.getElementById("danaList");
    if (container) {
      container.innerHTML = data
        .map(
          (d) =>
            `<div class="p-2 mb-1 border-bottom text-dark" style="background:#fff; border-radius:4px;">${d.judul} - Rp${d.amount}</div>`,
        )
        .join("");
    }
  } catch (err) {
    console.error("Gagal fetch dana:", err);
  }
}

async function addDana(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  try {
    const response = await fetch(`${API_URL}/dana`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (response.ok) {
      showToast("Data Dana berhasil diupload");
      e.target.reset();
      fetchDana();
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

async function fetchBuku() {
  try {
    const response = await fetch(`${API_URL}/buku`);
    const result = await response.json();
    const data = result.data || [];
    const container = document.getElementById("bukuList");
    if (container) {
      container.innerHTML = data
        .map(
          (b) =>
            `<div class="p-2 mb-1 border-bottom text-dark" style="background:#fff; border-radius:4px;">${b.judul} (${b.penulis})</div>`,
        )
        .join("");
    }
  } catch (err) {
    console.error("Gagal fetch buku:", err);
  }
}

async function addBuku(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  try {
    const response = await fetch(`${API_URL}/buku`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (response.ok) {
      showToast("Buku berhasil diupload");
      e.target.reset();
      fetchBuku();
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

async function fetchProker() {
  try {
    const response = await fetch(`${API_URL}/proker`);
    const result = await response.json();
    const data = result.data || [];
    const container = document.getElementById("prokerList");
    if (container) {
      container.innerHTML = data
        .map(
          (p) =>
            `<div class="p-2 mb-1 border-bottom text-dark" style="background:#fff; border-radius:4px;">${p.nama_proker} [${p.departemen_id}]</div>`,
        )
        .join("");
    }
  } catch (err) {
    console.error("Gagal fetch proker:", err);
  }
}

async function addProker(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  try {
    const response = await fetch(`${API_URL}/proker`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (response.ok) {
      showToast("Proker berhasil diupload");
      e.target.reset();
      fetchProker();
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

async function addPengaduan(e) {
  e.preventDefault();
  const formData = new FormData();
  formData.append("identitas", document.getElementById("ad_identitas").value);
  formData.append("nim", document.getElementById("ad_nim").value);
  formData.append("kontak", document.getElementById("ad_kontak").value);
  formData.append("jurusan", document.getElementById("ad_jurusan").value);
  formData.append("fakultas", document.getElementById("ad_fakultas").value);
  formData.append("subject", document.getElementById("ad_subject").value);
  formData.append(
    "description",
    document.getElementById("ad_description").value,
  );
  formData.append("bukti", document.getElementById("ad_bukti").files[0]);

  try {
    const response = await fetch(`${API_URL}/pengaduan`, {
      method: "POST",
      body: formData,
    });
    if (response.ok) {
      showToast("Pengaduan berhasil dikirim");
      e.target.reset();
      fetchPengaduan();
    } else {
      showToast("Gagal kirim pengaduan", "error");
    }
  } catch (err) {
    showToast("Kesalahan jaringan", "error");
  }
}

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
  if (document.getElementById("addPengaduanForm"))
    document.getElementById("addPengaduanForm").onsubmit = addPengaduan;

  // Jalankan fetch data secara terpisah agar tidak saling mengunci
  fetchPengurus();
  fetchPengaduan();
  fetchBerita();
  fetchCarouselControl();
  fetchDana();
  fetchBuku();
  fetchProker();
};

// Event listener untuk filter kategori
document
  .getElementById("filterKategoriBerita")
  ?.addEventListener("change", (e) => {
    fetchBerita(e.target.value);
  });
