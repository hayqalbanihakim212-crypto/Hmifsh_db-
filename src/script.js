const API_URL = "http://localhost:3000/api";
const socket = typeof io !== "undefined" ? io("http://localhost:3000") : null;

// Logika Real-time: Refresh data tanpa reload halaman
if (socket) {
  socket.on("update_proker", () => {
    const category = getCategoryFromPage();
    loadProker(category);
  });
  socket.on("update_berita", () => {
    const container = document.getElementById("beritaContainer");
    if (container) {
      currentBeritaPage = 1;
      hasMoreBerita = true;
      container.innerHTML = "";
      loadBerita(getCategoryFromPage());
    }
  });
  socket.on("update_events", () => loadEvents());
  socket.on("update_carousel", () => loadCarousel());
  socket.on("update_dana", () => loadDanaInfo());
  socket.on("update_buku", () => loadBuku());
}

function getCategoryFromPage() {
  const bodyClass = document.body.className;
  const path = window.location.pathname;
  if (bodyClass.includes("indexak") || path.includes("prokerAK")) return "AK";
  if (bodyClass.includes("indexkp") || path.includes("prokerKP")) return "KP";
  if (bodyClass.includes("indexpp") || path.includes("prokerPP.")) return "PP";
  if (bodyClass.includes("indexppa") || path.includes("prokerPPPA"))
    return "PPPA";
  if (bodyClass.includes("indexpkp") || path.includes("prokerPTKP"))
    return "PTKP";
  if (bodyClass.includes("indexkpp") || path.includes("prokerKPP"))
    return "KPP";
  return "";
}

const helpForm = document.getElementById("helpForm");
const buktiInput = document.getElementById("bukti");
const preview = document.getElementById("preview");

if (helpForm && buktiInput && preview) {
  buktiInput.addEventListener("change", () => {
    while (preview.firstChild) preview.removeChild(preview.firstChild);

    const file = buktiInput.files[0];
    if (!file) return;
    const fileURL = URL.createObjectURL(file);
    if (file.type.startsWith("image/")) {
      const img = document.createElement("img");
      img.src = fileURL;
      img.style.maxWidth = "200px";
      preview.appendChild(img);
    } else if (file.type.startsWith("video/")) {
      const video = document.createElement("video");
      video.src = fileURL;
      video.controls = true;
      video.style.maxWidth = "300px";
      preview.appendChild(video);
    } else {
      const text = document.createTextNode(`File terpilih: ${file.name}`);
      preview.appendChild(text);
    }
  });
}
if (helpForm) {
  helpForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Ambil data sebagai String (jangan pakai parseInt agar angka 0 di depan HP tidak hilang)
    const idStr = document.getElementById("identitas").value.trim();
    const nimStr = document.getElementById("nim").value.trim();
    const contakStr = document.getElementById("kontak").value.trim();
    const jurusanStr = document.getElementById("jurusan").value;
    const fakultasStr = document.getElementById("fakultas").value;
    const subject = document.getElementById("subject").value.trim();
    const description = document.getElementById("description").value.trim();
    const buktiFile = buktiInput ? buktiInput.files[0] : null;

    // Panggil fungsi validasi strict
    if (
      validateFormStrict(
        idStr,
        nimStr,
        contakStr,
        jurusanStr,
        fakultasStr,
        subject,
        description,
        buktiFile,
      )
    ) {
      const idempotencyKey = crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString();
      const formData = new FormData();
      formData.append("identitas", idStr);
      formData.append("nim", nimStr);
      formData.append("kontak", contakStr);
      formData.append("jurusan", jurusanStr);
      formData.append("fakultas", fakultasStr);
      formData.append("subject", subject);
      formData.append("description", description);
      formData.append("bukti", buktiFile);

      try {
        const response = await fetch(`${API_URL}/pengaduan`, {
          method: "POST",
          headers: { "X-Idempotency-Key": idempotencyKey },
          body: formData,
        });

        if (response.ok) {
          alert(
            "Terima kasih, pengaduan anda telah tersimpan aman di sistem kami.",
          );
          helpForm.reset();
          if (preview) preview.innerHTML = "";
        } else {
          alert("Gagal mengirim ke database. Server menolak data.");
        }
      } catch (error) {
        console.error("Error submit pengaduan:", error);
        alert("Terjadi kesalahan jaringan.");
      }
    }
  });
}

// Fungsi Validasi Keamanan Lanjutan (Mencegah Social Engineering)
function validateFormStrict(
  identitas,
  nim,
  kontak,
  jurusan,
  fakultas,
  subject,
  description,
  buktiFile,
) {
  const regexNIM = /^[0-9]{8,15}$/;
  const regexHP = /^(08|\+62)[0-9]{8,13}$/;
  const regexTextSafe = /^[a-zA-Z0-9\s.,'()-]+$/;

  if (!regexNIM.test(nim)) {
    alert("NIM Ditolak: Harus berupa angka 8-15 digit.");
    return false;
  }
  if (!regexHP.test(kontak)) {
    alert("Kontak Ditolak: Harus format valid (08... atau +62...).");
    return false;
  }
  if (
    !identitas ||
    !regexTextSafe.test(identitas) ||
    !subject ||
    !description
  ) {
    alert(
      "Teks Ditolak: Harap isi data dengan benar tanpa karakter khusus berbahaya.",
    );
    return false;
  }
  if (!jurusan || !fakultas) {
    alert("Ditolak: Harap pilih Fakultas dan Jurusan dari daftar.");
    return false;
  }
  if (!buktiFile) {
    alert("Ditolak: Harap lampirkan bukti file.");
    return false;
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "video/mp4",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (!allowedTypes.includes(buktiFile.type)) {
    alert("File Ditolak: Format file tidak didukung.");
    return false;
  }

  const maxSize = 10 * 1024 * 1024;
  if (buktiFile.size > maxSize) {
    alert("File Ditolak: Ukuran file terlalu besar (Maksimal 10 MB).");
    return false;
  }

  return true;
}

let currentBeritaPage = 1;
let isBeritaLoading = false;
let hasMoreBerita = true;

async function loadCarousel() {
  const container = document.getElementById("carouselData");
  if (!container) return;

  try {
    const response = await fetch(`${API_URL}/carousel`);
    const data = await response.json();

    if (data.length > 0) {
      container.innerHTML = ""; // Bersihkan slide statis
      data.forEach((slide, index) => {
        const item = document.createElement("div");
        item.className = `carousel-item ${index === 0 ? "active" : ""}`;

        const img = document.createElement("img");
        img.src = `http://localhost:3000${slide.file_path}`;
        img.className = "d-block w-100";
        img.alt = slide.judul || "Slide";

        item.appendChild(img);
        container.appendChild(item);
      });
    }
  } catch (err) {
    console.error("Gagal memuat carousel:", err);
  }
}

async function loadBerita(category = "") {
  if (isBeritaLoading || !hasMoreBerita) return;
  isBeritaLoading = true;

  const container = document.getElementById("beritaContainer");
  if (!container) return;

  // Tampilkan spinner menggunakan template dari HTML
  const loaderTemplate = document.getElementById("loaderTemplate");
  let loaderInstance = null;
  if (loaderTemplate) {
    loaderInstance = loaderTemplate.content.cloneNode(true).firstElementChild;
    container.appendChild(loaderInstance);
  }

  try {
    let fetchUrl = `${API_URL}/berita?page=${currentBeritaPage}&limit=6`;
    if (category) {
      fetchUrl += `&bidang=${category}`;
    }

    const response = await fetch(fetchUrl);
    if (!response.ok) throw new Error("Network response was not ok");

    const result = await response.json();
    const { data: dataBerita, total } = result;
    const beritaTemplate = document.getElementById("beritaTemplate");

    if (!Array.isArray(dataBerita) || dataBerita.length === 0) {
      if (currentBeritaPage === 1) {
        container.innerHTML =
          '<div class="col-12 text-center text-muted py-4">Belum ada berita untuk kategori ini.</div>';
      }
      hasMoreBerita = false;
      return;
    }

    dataBerita.forEach((berita) => {
      const imageURL = berita.file_path
        ? `http://localhost:3000${berita.file_path}`
        : "https://via.placeholder.com/300x200?text=No+Image";
      const tanggal = new Date(berita.created_at).toLocaleDateString("id-ID");

      if (beritaTemplate) {
        const clone = beritaTemplate.content.cloneNode(true);
        clone.querySelector("img").src = imageURL;
        clone.querySelector(".card-title").textContent = berita.judul;

        const contentText = clone.querySelector(".card-text");
        contentText.textContent = berita.konten;
        contentText.classList.add("text-truncate");

        clone.querySelector(".text-muted").textContent = tanggal;

        const btnReadMore = document.createElement("button");
        btnReadMore.className = "btn btn-link p-0 text-success mt-2";
        btnReadMore.textContent = "Baca Selengkapnya";
        btnReadMore.onclick = (e) => {
          contentText.classList.toggle("text-truncate");
          btnReadMore.textContent = contentText.classList.contains(
            "text-truncate",
          )
            ? "Baca Selengkapnya"
            : "Tutup";
        };
        clone.querySelector(".card-body").appendChild(btnReadMore);

        container.appendChild(clone);
      }
    });

    if (container.children.length >= total) {
      hasMoreBerita = false;
    } else {
      currentBeritaPage++;
    }
  } catch (err) {
    console.error("Gagal memuat berita:", err);
  } finally {
    isBeritaLoading = false;
  }
}
async function loadBuku() {
  const container = document.getElementById("bukuContainer");
  const template = document.getElementById("bukuTemplate");
  if (!container || !template) return;

  try {
    const response = await fetch(`${API_URL}/buku?limit=8`);
    const result = await response.json();
    const dataBuku = result.data || [];

    // Bersihkan container sebelum menambahkan buku baru
    container.innerHTML = "";

    dataBuku.forEach((buku) => {
      const clone = template.content.cloneNode(true);
      clone.querySelector(".book-title").textContent = buku.judul;
      clone.querySelector(".book-author").textContent =
        buku.penulis || "Anonim";

      const link = clone.querySelector(".book-link");
      if (buku.file_path) {
        link.href = `http://localhost:3000${buku.file_path}`;
      } else {
        link.style.display = "none"; // Sembunyikan tombol jika tidak ada file
      }

      container.appendChild(clone);
    });
  } catch (err) {
    console.error("Gagal memuat buku:", err);
    // Opsional: Tampilkan pesan error di UI
    // container.innerHTML = '<p class="text-danger">Gagal memuat buku.</p>';
  }
}

async function loadProker(departemen = "") {
  const container = document.getElementById("prokerContainer");
  const template = document.getElementById("beritaTemplate"); // Menggunakan template yang sama
  if (!container || !template) return;

  try {
    const response = await fetch(`${API_URL}/proker`);
    const result = await response.json();
    const data = result.data || [];

    container.innerHTML = "";
    let visibleCount = 0;
    data.forEach((p) => {
      // Filter case-insensitive untuk keamanan data
      if (
        departemen &&
        p.departemen_id?.toUpperCase() !== departemen.toUpperCase()
      )
        return;
      visibleCount++;

      const clone = template.content.cloneNode(true);
      clone.querySelector("img").src = p.file_path
        ? `http://localhost:3000${p.file_path}`
        : "https://via.placeholder.com/300x200?text=Proker";
      clone.querySelector(".card-title").textContent = p.nama_proker;

      const contentText = clone.querySelector(".card-text");
      contentText.textContent = p.deskripsi;

      clone.querySelector(".text-muted").textContent =
        `Bidang: ${p.departemen_id}`;

      const btnReadMore = document.createElement("button");
      btnReadMore.className = "btn btn-link p-0 text-success mt-2";
      btnReadMore.textContent = "Baca Selengkapnya";
      btnReadMore.onclick = () => {
        contentText.classList.toggle("text-truncate");
        btnReadMore.textContent = contentText.classList.contains(
          "text-truncate",
        )
          ? "Baca Selengkapnya"
          : "Tutup";
      };
      clone.querySelector(".card-body").appendChild(btnReadMore);

      container.appendChild(clone);
    });

    if (visibleCount === 0) {
      container.innerHTML =
        '<div class="col-12 text-center text-muted py-4">Belum ada program kerja untuk bidang ini.</div>';
    }
  } catch (err) {
    console.error("Gagal memuat proker:", err);
  }
}

async function loadEvents() {
  const container = document.getElementById("eventContainer");
  if (!container) return;

  try {
    const response = await fetch(`${API_URL}/events?limit=3`); // Load a few events for the home page
    const result = await response.json();
    const dataEvents = result.data || [];

    container.innerHTML = ""; // Clear existing content

    if (dataEvents.length === 0) {
      container.innerHTML =
        '<p class="text-muted">Tidak ada event mendatang.</p>';
      return;
    }

    dataEvents.forEach((event) => {
      const eventCard = document.createElement("div");
      eventCard.className = "col-md-4 mb-4 fade-in";
      eventCard.innerHTML = `
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <h5 class="card-title text-success">${event.judul}</h5>
            <p class="card-text text-truncate">${event.deskripsi || ""}</p>
            <p class="card-text"><small class="text-muted">${new Date(event.tanggal).toLocaleDateString("id-ID")} - ${event.lokasi}</small></p>
          </div>
        </div>
      `;
      container.appendChild(eventCard);
    });
  } catch (err) {
    console.error("Gagal memuat event:", err);
  }
}

// Implementasi Infinite Scroll
window.addEventListener("scroll", () => {
  if (
    window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 &&
    !isBeritaLoading
  ) {
    loadBerita();
  }
});

/**
 * Implementasi React Component untuk Grafik Real-time
 * Menggunakan Chart.js untuk visualisasi data dari Postgres
 */
function OrganisationalChart() {
  const [data, setData] = React.useState([]);

  const fetchData = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/stats/growth");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Gagal memuat statistik:", err);
    }
  };

  React.useEffect(() => {
    fetchData();
    // Polling sederhana untuk simulasi real-time (setiap 30 detik)
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (data.length === 0) return;

    const ctx = document.getElementById("growthChartCanvas");
    if (!ctx) return;

    // Hancurkan chart lama jika ada sebelum membuat baru
    const existingChart = Chart.getChart("growthChartCanvas");
    if (existingChart) existingChart.destroy();

    new Chart(ctx, {
      type: "line",
      data: {
        labels: data.map((d) => d.bulan),
        datasets: [
          {
            label: "Jumlah Anggota",
            data: data.map((d) => d.jumlah),
            borderColor: "#006400",
            backgroundColor: "rgba(0, 100, 0, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });
  }, [data]);

  return React.createElement(
    "div", // Ini adalah div pembungkus untuk elemen canvas
    { style: { height: "100%", width: "100%" } }, // Biarkan div induk (growth-chart-root-sidebar) mengontrol tinggi
    React.createElement("canvas", { id: "growthChartCanvas" }),
  );
}

// Deteksi halaman untuk menentukan kategori data yang akan dimuat
document.addEventListener("DOMContentLoaded", () => {
  const category = getCategoryFromPage();
  loadCarousel();
  loadBerita(category);
  loadBuku();
  loadEvents(); // Load events for public pages
  loadDanaInfo(); // Load dana info for public pages
  loadGrowthChart(); // Handles React rendering safely
  loadProker(category); // Load proker with category
  const observerOptions = {
    rootMargin: "-5% 0px -5% 0px",
    threshold: 0.15,
  };

  const bgSlides = {
    "section-berita": document.getElementById("bg-slide-2"), // Dari Kiri
    "section-event": document.getElementById("bg-slide-1"), // Dari Kanan
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const targetId = entry.target.id;

      if (entry.isIntersecting) {
        entry.target.classList.add("active");
        // Aktifkan slide background jika ada mappingnya
        if (bgSlides[targetId]) {
          Object.values(bgSlides).forEach((s) =>
            s?.classList.remove("bg-active"),
          );
          bgSlides[targetId].classList.add("bg-active");
        }
      } else {
        // Opsional: Hilangkan background saat keluar view
        if (bgSlides[targetId]) {
          bgSlides[targetId].classList.remove("bg-active");
        }
      }
    });
  }, observerOptions);

  // Targetkan semua elemen dengan class 'reveal' untuk dianimasikan
  document.querySelectorAll(".reveal").forEach((el) => {
    observer.observe(el);
  });
});

// Fungsi untuk memuat informasi dana di sidebar
async function loadDanaInfo() {
  const container = document.getElementById("danaInfoContainer");
  if (!container) return;

  try {
    const response = await fetch(`${API_URL}/dana?limit=1`); // Ambil 1 data dana terbaru
    const result = await response.json();
    const latestDana =
      result.data && result.data.length > 0 ? result.data[0] : null;

    if (latestDana) {
      container.innerHTML = `
        <div class="card-body">
          <h6 class="card-title text-success">Informasi Dana Terbaru</h6>
          <p class="card-text small text-muted mb-1">${latestDana.judul}</p>
          <p class="card-text small text-muted mb-3">Rp${Number(latestDana.amount).toLocaleString("id-ID")}</p>
          ${latestDana.file_path ? `<a href="http://localhost:3000${latestDana.file_path}" target="_blank" class="btn btn-sm btn-outline-success">Lihat Laporan</a>` : ""}
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="card-body">
          <h6 class="card-title text-success">Informasi Dana</h6>
          <p class="card-text small text-muted">Belum ada data dana.</p>
        </div>
      `;
    }
  } catch (err) {
    console.error("Gagal memuat informasi dana:", err);
    container.innerHTML = `
      <div class="card-body">
        <h6 class="card-title text-danger">Gagal memuat informasi dana.</h6>
      </div>
    `;
  }
}

// Fungsi untuk memuat grafik pertumbuhan di sidebar
function loadGrowthChart() {
  const chartRoot =
    document.getElementById("growth-chart-root") ||
    document.getElementById("growth-chart-root-sidebar");
  if (chartRoot && typeof ReactDOM !== "undefined") {
    ReactDOM.createRoot(chartRoot).render(
      React.createElement(OrganisationalChart),
    );
  } else if (chartRoot) {
    console.warn("React/ReactDOM tidak dimuat, grafik tidak bisa dirender.");
  }
}
