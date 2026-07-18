<div align="center">

# 🕌 HMI FSH UINSU
### *Website Resmi & Sistem Pengaduan*
### HMI Komisariat Fakultas Syari'ah dan Hukum — UIN Sumatera Utara

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Bootstrap](https://img.shields.io/badge/Bootstrap_5-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)](https://getbootstrap.com/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)

> Platform digital HMI Komisariat FSH UINSU — profil organisasi, program kerja per bidang, sistem pengaduan mahasiswa, dan dashboard admin real-time.

**YAKUSA!** 🤝

</div>

---

## 🌐 Tautan Demo

| Halaman | Link |
|---------|------|
| 🏠 Beranda | [index.html](https://hayqalbanihakim212-crypto.github.io/Hmifsh_db-/src/index.html) |
| 📖 Tentang Kami | [about.html](https://hayqalbanihakim212-crypto.github.io/Hmifsh_db-/src/about.html) |
| 📋 Pusat Bantuan | [help.html](https://hayqalbanihakim212-crypto.github.io/Hmifsh_db-/src/help.html) |
| 📞 Kontak | [contact.html](https://hayqalbanihakim212-crypto.github.io/Hmifsh_db-/src/contact.html) |
| 🔐 Login Admin | [login.html](https://hayqalbanihakim212-crypto.github.io/Hmifsh_db-/adminDasboard/login.html) |
| ⚙️ Dashboard Admin | [admin.html](https://hayqalbanihakim212-crypto.github.io/Hmifsh_db-/adminDasboard/admin.html) |

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| 🎠 **Carousel Dinamis** | Slideshow foto dikelola admin secara real-time |
| 📰 **Berita & Event** | Publikasi berita dan event per bidang dengan infinite scroll |
| 📚 **Perpustakaan Digital** | Buku & dokumen panduan yang bisa diunduh |
| 📊 **Statistik Pertumbuhan** | Grafik kader real-time berbasis Chart.js |
| 👥 **Struktur Bidang** | Profil foto pengurus per departemen |
| 📋 **Form Pengaduan** | Laporan kasus mahasiswa dengan upload & preview bukti |
| 💰 **Transparansi Dana** | Informasi keuangan organisasi |
| 🔐 **Dashboard Admin** | CRUD lengkap semua konten via panel admin |
| ⚡ **Real-time Socket.io** | Update otomatis tanpa reload halaman |
| 🔔 **Toast Notification** | Notifikasi aksi admin dengan animasi slide-in |

---

## 🎨 CSS — `style.css`

Menggunakan pendekatan **glassmorphism** dan **dark theme** khas HMI:

```css
/* Variabel Warna Utama */
--hmi-green:       #006400   /* Hijau tua HMI */
--hmi-green-light: #00a000   /* Hijau terang aksen */
--hmi-black:       #1a1a1a   /* Background navbar */
--hmi-white:       #ffffff   /* Teks utama */
```

**Teknik CSS yang digunakan:**

| Teknik | Penerapan |
|--------|-----------|
| `backdrop-filter: blur()` | Glassmorphism card & navbar |
| `background: linear-gradient` | Dark gradient background halaman |
| `CSS Custom Properties` | Tema warna konsisten seluruh halaman |
| `@keyframes fadeInUp` | Animasi card muncul dari bawah |
| `@keyframes slideIn` | Animasi toast notification dari kanan |
| `@keyframes spin` | Loading spinner |
| `transition` | Hover effect card departemen |
| `::after pseudo-element` | Logo watermark transparan per bidang |
| `position: sticky` | Navbar mengikuti scroll |
| `clip-path: circle()` | Foto pengurus berbentuk lingkaran |

---

## ⚙️ JavaScript — `script.js`

File JS utama yang menangani semua logika frontend:

**🔌 Real-time dengan Socket.io**
```js
// Auto-refresh konten saat admin upload tanpa perlu reload
socket.on("update_berita",   () => loadBerita());
socket.on("update_events",   () => loadEvents());
socket.on("update_carousel", () => loadCarousel());
socket.on("update_proker",   () => loadProker());
socket.on("update_dana",     () => loadDanaInfo());
socket.on("update_buku",     () => loadBuku());
```

**📂 Deteksi Bidang Otomatis**
```js
// Mendeteksi halaman bidang dari class body
function getCategoryFromPage() {
  if (bodyClass.includes("indexak"))  return "AK";   // Administrasi
  if (bodyClass.includes("indexkp"))  return "KP";   // Keuangan
  if (bodyClass.includes("indexpp"))  return "PP";   // Pemberdayaan Perempuan
  if (bodyClass.includes("indexppa")) return "PPPA"; // Penelitian
  if (bodyClass.includes("indexpkp")) return "PTKP"; // Training
  if (bodyClass.includes("indexkpp")) return "KPP";  // Kewirausahaan
}
```

**📋 Form Pengaduan**
- Validasi input strict (NIM angka, kontak format 08/+62)
- Preview file otomatis: gambar → `<img>`, video → `<video>`, dokumen → nama file
- UUID idempotency key untuk mencegah submit ganda
- Upload `multipart/form-data` ke backend

**🎠 Carousel & Konten Dinamis**
- Load carousel dari API, render via HTML `<template>`
- Infinite scroll untuk berita
- Chart.js bar chart pertumbuhan kader di sidebar

**📜 Reveal on Scroll**
```js
// Elemen animasi masuk saat discroll ke viewport
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => e.target.classList.toggle("active", e.isIntersecting));
});
```

---

## 🖥️ Backend — `serverBackend.js`

REST API berbasis **Node.js + Express** dengan fitur:

| Package | Fungsi |
|---------|--------|
| `express` | HTTP server & routing |
| `pg` (node-postgres) | Koneksi ke PostgreSQL |
| `socket.io` | Real-time event ke frontend |
| `multer` | Upload file (gambar, dokumen) |
| `jsonwebtoken` | Autentikasi admin via JWT |
| `uuid` | Idempotency key pengaduan |
| `cors` | Cross-origin request |
| `dotenv` | Konfigurasi environment |

**Endpoint API:**

```
POST   /api/login              → Login admin, return JWT
GET    /api/carousel           → Ambil semua slide
POST   /api/carousel           → Upload slide baru (admin)
DELETE /api/carousel/:id       → Hapus slide

GET    /api/berita             → Berita (filter ?bidang=AK)
POST   /api/berita             → Upload berita + gambar
DELETE /api/berita/:id         → Hapus berita

GET    /api/events             → Daftar event
POST   /api/events             → Upload event
DELETE /api/events/:id         → Hapus event

GET    /api/buku               → Perpustakaan
POST   /api/buku               → Upload buku/PDF
DELETE /api/buku/:id           → Hapus buku

GET    /api/proker             → Program kerja (filter ?departemen_id=AK)
POST   /api/proker             → Upload proker
DELETE /api/proker/:id         → Hapus proker

GET    /api/dana               → Info keuangan
POST   /api/dana               → Upload dana
GET    /api/stats-growth       → Data grafik pertumbuhan
POST   /api/stats-growth       → Update statistik

GET    /api/pengaduan          → Daftar pengaduan (admin)
POST   /api/pengaduan          → Submit pengaduan mahasiswa
DELETE /api/pengaduan/:id      → Hapus pengaduan
```

---

## 🗂️ Struktur Proyek

```
Hmifsh_db-/
├── src/                    # Halaman publik
│   ├── index.html
│   ├── about.html
│   ├── contact.html
│   ├── help.html
│   ├── script.js           # JS utama (Socket.io, API calls, animasi)
│   └── style.css           # CSS utama (glassmorphism, animasi, tema)
├── adminDasboard/          # Panel admin
│   ├── admin.html
│   ├── admin.js            # CRUD semua konten
│   ├── login.html
│   └── login.js            # Auth JWT
├── programKerja/           # Halaman per bidang (6 bidang)
│   ├── prokerAK.html
│   ├── prokerKP.html
│   ├── prokerKPP.html
│   ├── prokerPP.html
│   ├── prokerPPPA.html
│   └── prokerPTKP.html
├── backend-node/
│   └── serverBackend.js    # Express + Socket.io + PostgreSQL
├── strukturan.png/         # Foto pengurus & logo
└── schema.sql              # DDL PostgreSQL
```

---

## 🚀 Cara Menjalankan Lokal

```bash
# 1. Clone repo
git clone https://github.com/hayqalbanihakim212-crypto/Hmifsh_db-.git
cd Hmifsh_db-

# 2. Setup database
psql -U postgres -f schema.sql

# 3. Buat file .env di backend-node/
PORT=3000
JWT_SECRET=rahasia_kamu
DATABASE_URL=postgres://user:pass@localhost:5432/hmifsh

# 4. Jalankan backend
cd backend-node
npm install
node serverBackend.js

# 5. Buka src/index.html di browser
```

---

<div align="center">

© 2025–2028 HMI Komisariat FSH UINSU · **Yakusa!** 🤝

Dikembangkan oleh [hayqalbanihakim212-crypto](https://github.com/hayqalbanihakim212-crypto)

</div>
