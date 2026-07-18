<div align="center">

# 🕌 HMI FSH UINSU
### *Website Resmi & Sistem Pengaduan*
### HMI Komisariat Fakultas Syari'ah dan Hukum — UIN Sumatera Utara

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![Bootstrap](https://img.shields.io/badge/Bootstrap_5-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)](https://getbootstrap.com/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)

> Platform digital HMI Komisariat FSH UINSU — menampilkan profil organisasi, program kerja per bidang, sistem pengaduan mahasiswa, dan dashboard admin berbasis real-time.

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
| 📰 **Berita & Event** | Publikasi berita dan event per bidang |
| 📚 **Perpustakaan Digital** | Buku & dokumen panduan yang bisa diunduh |
| 📊 **Statistik Pertumbuhan** | Grafik kader berbasis Chart.js (real-time) |
| 👥 **Struktur Bidang** | Profil pengurus per departemen |
| 📋 **Form Pengaduan** | Laporan kasus mahasiswa dengan upload bukti |
| 💰 **Transparansi Dana** | Informasi keuangan organisasi |
| 🔐 **Dashboard Admin** | CRUD lengkap semua konten website |
| ⚡ **Real-time** | Update langsung via Socket.io |

---

## 🏛️ Struktur Bidang

```
HMI Komisariat FSH UINSU (2025–2028)
│
├── 📁 Administrasi & Kesekretariatan (AK)
├── 📁 Keuangan & Perlengkapan (KP)
├── 📁 Penelitian, Pengembangan & Pembinaan Anggota (PPPA)
├── 📁 Pendidikan, Training & Kader Pengembang (PTKP)
├── 📁 Kewirausahaan & Pengembangan Profesi (KPP)
└── 📁 Pemberdayaan Perempuan (PP)
```

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | HTML5, CSS3, Bootstrap 5, JavaScript Vanilla |
| Visualisasi | Chart.js |
| Backend | Node.js + Express |
| Real-time | Socket.io |
| Database | PostgreSQL |
| Auth | JWT Token |

---

## 🗂️ Struktur Proyek

```
Hmifsh_db-/
├── src/                    # Halaman utama
│   ├── index.html          # Beranda
│   ├── about.html          # Sejarah HMI FSH
│   ├── contact.html        # Kontak
│   ├── help.html           # Form pengaduan
│   ├── script.js           # JavaScript utama
│   └── style.css           # Stylesheet
├── adminDasboard/          # Panel admin
│   ├── admin.html          # Dashboard CRUD
│   ├── admin.js
│   ├── login.html
│   └── login.js
├── programKerja/           # Halaman per bidang
│   ├── prokerAK.html
│   ├── prokerKP.html
│   ├── prokerKPP.html
│   ├── prokerPP.html
│   ├── prokerPPPA.html
│   └── prokerPTKP.html
├── backend-node/
│   └── serverBackend.js    # REST API + Socket.io
├── strukturan.png/         # Aset gambar pengurus
└── schema.sql              # Skema database PostgreSQL
```

---

## 🚀 Cara Menjalankan Lokal

### Prasyarat
- Node.js `v18+`
- PostgreSQL

### Setup

```bash
# 1. Clone repo
git clone https://github.com/hayqalbanihakim212-crypto/Hmifsh_db-.git
cd Hmifsh_db-

# 2. Setup database
psql -U postgres -f schema.sql

# 3. Jalankan backend
cd backend-node
npm install
node serverBackend.js
# → berjalan di http://localhost:3000

# 4. Buka frontend
# Buka src/index.html di browser
```

---

## 🗄️ Skema Database

```sql
admins       → Login admin
berita       → Berita per bidang
events       → Jadwal event
buku         → Perpustakaan digital
proker       → Program kerja per departemen
dana         → Informasi keuangan
carousel     → Slideshow beranda
pengaduan    → Laporan/keluhan mahasiswa
stats_growth → Data pertumbuhan kader
```

---

<div align="center">

© 2025–2028 HMI Komisariat FSH UINSU · **Yakusa!** 🤝

Dikembangkan dengan ❤️ oleh [hayqalbanihakim212-crypto](https://github.com/hayqalbanihakim212-crypto)

</div>
