const API_URL = "http://localhost:3000/api";

async function initWebsite() {
  try {
    const res = await fetch(`${API_URL}/pengurus`);
    if (!res.ok) throw new Error("Gagal mengambil data");

    const result = await res.json();
    // Backend mengembalikan { data: [...], total: X }
    renderPengurus(result.data || []);
  } catch (err) {
    console.error("Gagal memuat data pengurus:", err);
  }
}
initWebsite();

function renderPengurus(data) {
  const container = document.getElementById("pengurusContainer");
  if (!container) return;

  container.innerHTML = "";
  data.forEach((p) => {
    const wrapper = document.createElement("div");
    wrapper.className = "namaKeumuman reveal";

    const photoUrl = p.foto_path
      ? `http://localhost:3000${p.foto_path}`
      : "../strukturan.png/HMIKOHATIlogo.png";

    wrapper.innerHTML = `
      <div class="pengurus-item" style="${p.web ? "cursor:pointer" : ""}">
        <img src="${photoUrl}" class="circle-crop" alt="Foto" />
        <div>
          <h3 class="pengurus-name">${p.nama}</h3>
          <p class="pengurus-title">${p.jabatan || "Pengurus"}</p>
          <button class="btn" id="btn-${p.id}">Following</button>
        </div>
      </div>
    `;

    // Event untuk tombol Instagram
    const btn = wrapper.querySelector("button");
    if (p.sosmed) {
      btn.onclick = (e) => {
        e.stopPropagation();
        const igUser = p.sosmed.replace("@", "");
        window.open(`https://instagram.com/${igUser}`, "_blank");
      };
    }

    // Event untuk redirect web personal
    if (p.web) {
      wrapper.querySelector(".pengurus-item").onclick = () => {
        window.location.href = `${p.web}?id=${p.id}`;
      };
    }

    container.appendChild(wrapper);
  });
}

function setupRedirects(pengurusArray) {
  pengurusArray.forEach((item) => {
    const element = document.getElementById(item.id);
    if (element && item.web) {
      element.style.cursor = "pointer";
      element.addEventListener("click", () => {
        window.location.href = `${item.web}?id=${item.id}`;
      });
    }
  });
}
// initWebsite();

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

function linkFollowingButtons(pengurusArray) {
  // Mapping ID tombol ke data pengurus
  const buttonMap = {
    ketua: "Ajri Ajhad Ajijan S.Meliala",
    sekretaris: "Fitrah Ade Dikiansyah",
    bendahara: "Sahara Aulia Nasution",
  };

  Object.keys(buttonMap).forEach((btnId) => {
    const btn = document.getElementById(btnId);
    const data = pengurusArray.find((p) => p.nama === buttonMap[btnId]);
    if (btn && data && data.sosmed) {
      btn.addEventListener("click", () => {
        const igUser = data.sosmed.replace("@", "");
        window.open(`https://instagram.com/${igUser}`, "_blank");
      });
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

  // Tentukan endpoint berdasarkan kategori jika ada
  let fetchUrl = `${API_URL}/berita?page=${currentBeritaPage}&limit=6`;
  if (category) {
    fetchUrl += `&bidang=${category}`;
  }

  const response = await fetch(fetchUrl);
  const result = await response.json();

  // Hapus loader setelah data diterima
  if (loaderInstance) loaderInstance.remove();

  const { data: dataBerita, total } = result;
  const beritaTemplate = document.getElementById("beritaTemplate");

  dataBerita.forEach((berita) => {
    const imageURL = berita.file_path
      ? `http://localhost:3000${berita.file_path}`
      : "https://via.placeholder.com/300x200?text=No+Image";
    const tanggal = new Date(berita.created_at).toLocaleDateString("id-ID");

    if (beritaTemplate) {
      const clone = beritaTemplate.content.cloneNode(true);
      clone.querySelector("img").src = imageURL;
      clone.querySelector(".card-title").textContent = berita.judul;
      clone.querySelector(".card-text").textContent = berita.konten;
      clone.querySelector(".text-muted").textContent = tanggal;
      container.appendChild(clone);
    }
  });

  // Cek apakah data sudah habis
  if (container.children.length >= total) {
    hasMoreBerita = false;
  } else {
    currentBeritaPage++;
  }

  isBeritaLoading = false;
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
    "div",
    { style: { height: "300px", width: "100%" } },
    React.createElement("canvas", { id: "growthChartCanvas" }),
  );
}

// Deteksi halaman untuk menentukan kategori data yang akan dimuat
document.addEventListener("DOMContentLoaded", () => {
  const bodyClass = document.body.className;
  let category = "";

  if (bodyClass.includes("indexak")) category = "AK";
  else if (bodyClass.includes("indexkp")) category = "KP";
  else if (bodyClass.includes("indexpp")) category = "PP";
  else if (bodyClass.includes("indexppa")) category = "PPPA";
  else if (bodyClass.includes("indexpkp")) category = "PTKP";
  else if (bodyClass.includes("indexkpp")) category = "KPP";

  loadCarousel();
  loadBerita(category);

  // Render React Component jika element root tersedia
  const chartRoot = document.getElementById("growth-chart-root");
  if (chartRoot) {
    ReactDOM.createRoot(chartRoot).render(
      React.createElement(OrganisationalChart),
    );
  }
  // Logika Latar Belakang Dinamis & Scroll Reveal
  const observerOptions = {
    threshold: 0.15,
    rootMargin: "-5% 0px -5% 0px",
  };

  const bgSlides = {
    "section-berita": document.getElementById("bg-slide-2"), // Dari Kiri
    "section-event": document.getElementById("bg-slide-1"), // Dari Kanan
    "section-pengumuman": document.getElementById("bg-slide-4"), // Dari Bawah
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

  // Targetkan section dan card untuk dianimasikan
  document
    .querySelectorAll("section, .card, .welcome-section, .namaKeumuman")
    .forEach((el) => {
      el.classList.add("reveal");
      observer.observe(el);
    });
});
