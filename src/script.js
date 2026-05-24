const API_URL = "http://localhost:3000/api";

async function initWebsite() {
  try {
    const res = await fetch(`${API_URL}/pengurus`);
    const pengurusArray = await res.json();
    setupRedirects(pengurusArray);
  } catch (err) {
    console.error("Gagal memuat data pengurus:", err);
  }
}
// const pengurusArray = [
//   {id = "departemen1",
//   web = "..\programKerja\prokerPP.html"},
//   {id = "departemen2",
//   web = "../programKerja/prokerAK"},
//   "departemen3",
//   "departemen4",
//   "departemen5",
//   "departemen6",
// ];

// function setupRedirects(pengurusArray) {
//   pengurusArray.forEach((item) => {
//     const element = document.getElementById(item.id);
//     if (element && item.web) {
//       element.addEventListener("click", () => {
//         window.location.href = `${item.web}?id=${item.id}`;
//       });
//     }
//   });
// }
// initWebsite();

const helpForm = document.getElementById("helpForm");
const buktiInput = document.getElementById("bukti");
const preview = document.getElementById("preview");

if (helpForm && buktiInput && preview) {
  buktiInput.addEventListener("change", () => {
    preview.innerHTML = "";
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
      preview.textContent = `File terpilih: ${file.name}`;
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

async function loadBerita() {
  if (isBeritaLoading || !hasMoreBerita) return;

  isBeritaLoading = true;
  const response = await fetch(
    `${API_URL}/berita?page=${currentBeritaPage}&limit=6`,
  );
  const result = await response.json();
  const { data: dataBerita, total } = result;

  const container = document.getElementById("beritaContainer");
  if (!container) {
    isBeritaLoading = false;
    return;
  }

  dataBerita.forEach((berita) => {
    const imageURL = berita.file_path
      ? `http://localhost:3000${berita.file_path}`
      : "https://via.placeholder.com/300x200?text=No+Image";
    const tanggal = new Date(berita.created_at).toLocaleDateString("id-ID");
    const cardHTML = `
    <div class="col-md-4 mb-4">
    <div class="card">
      <img src="${imageURL}" class="card-img-top" alt="...">
      <div class="card-body">
        <h5 class="card-title">${berita.judul}</h5>
        <p class="card-text">${berita.konten}</p>
        <p class="card-text"><small class="text-muted">${tanggal}</small></p>
      </div>
    </div>
  </div>`;
    container.innerHTML += cardHTML;
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

loadBerita();
