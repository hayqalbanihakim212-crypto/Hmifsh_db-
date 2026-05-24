const dotenv = require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const app = express();

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "kunci_rahasia_hmif_2025";

const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Middleware
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));

// Konfigurasi Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Konfigurasi PostgreSQL (Mendukung Local & Production)
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes("postgres")
          ? {
              rejectUnauthorized: false,
            }
          : false,
      }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT || 5432,
      },
);

pool.connect((err, client, release) => {
  if (err) {
    return console.log("gagal terhubung ke Database PostgreSQL", err.stack);
  } else {
    return console.log("berhasil terhubung ke Database PostgreSQL");
    release();
  }
});

// --- MIDDLEWARE IDEMPOTENCY ---
const processedKeys = new Set();
const idempotencyCheck = (req, res, next) => {
  const key = req.headers["x-idempotency-key"];
  if (req.method === "POST" && key) {
    if (processedKeys.has(key)) {
      return res.status(409).json({
        error: "Permintaan duplikat terdeteksi",
        message: "Data ini sudah sedang diproses atau telah berhasil disimpan.",
      });
    }
    processedKeys.add(key);
  }
  next();
};

// Middleware verifikasi Token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Route utama agar tidak muncul "Cannot GET /"
app.get("/", (req, res) => {
  res.send("API Website HMIF Backend is Running...");
});

// --- ENDPOINT LOGIN ---
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM admins WHERE username = $1 AND password = $2",
      [username, password],
    );

    if (result.rows.length > 0) {
      const token = jwt.sign(
        { id: result.rows[0].id, role: "admin" },
        JWT_SECRET,
        { expiresIn: "2h" },
      );
      res.json({ success: true, token });
    } else {
      res
        .status(401)
        .json({ success: false, message: "Username atau password salah" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Database error" });
  }
});

// --- ENDPOINT PENGURUS ---

app.get("/api/pengurus", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    res.set("Cache-Control", "public, max-age=300");
    const result = await pool.query(
      "SELECT *, count(*) OVER() AS total_count FROM pengurus ORDER BY id_order ASC LIMIT $1 OFFSET $2",
      [limit, offset],
    );

    const total =
      result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
    res.json({
      data: result.rows.map(({ total_count, ...rest }) => rest),
      total: total,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/pengurus", authenticateToken, async (req, res) => {
  const { id, nama, sosmed, web, id_order } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO pengurus (id, nama, sosmed, web, id_order) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [id, nama, sosmed, web, id_order],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/pengurus/:id", authenticateToken, async (req, res) => {
  try {
    await pool.query("DELETE FROM pengurus WHERE id = $1", [req.params.id]);
    res.json({ message: "Pengurus dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ENDPOINT PENGADUAN ---

app.post(
  "/api/pengaduan",
  idempotencyCheck,
  upload.single("bukti"),
  async (req, res) => {
    const { identitas, nim, kontak, jurusan, fakultas, subject, description } =
      req.body;
    const file_path = req.file ? `/uploads/${req.file.filename}` : null;

    // 1. VALIDASI KEAMANAN REGEX DI BACKEND
    const regexNIM = /^[0-9]{8,15}$/;
    const regexHP = /^(08|\+62)[0-9]{8,13}$/;
    const regexTextSafe = /^[a-zA-Z0-9\s.,'()-]+$/;

    let errorMessage = null;
    if (!nim || !regexNIM.test(nim)) errorMessage = "NIM tidak valid.";
    else if (!kontak || !regexHP.test(kontak))
      errorMessage = "Format nomor HP tidak valid.";
    else if (!identitas || !regexTextSafe.test(identitas))
      errorMessage = "Identitas mengandung karakter berbahaya.";
    else if (!jurusan || !fakultas)
      errorMessage = "Jurusan dan Fakultas wajib diisi.";
    else if (!req.file) errorMessage = "Bukti lampiran wajib diunggah.";

    if (errorMessage) {
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          console.error("Gagal hapus file:", err);
        }
      }
      return res.status(400).json({ success: false, message: errorMessage });
    }

    try {
      const result = await pool.query(
        "INSERT INTO pengaduan (identitas, nim, kontak, jurusan, fakultas, subject, description, file_path) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
        [
          identitas,
          nim,
          kontak,
          jurusan,
          fakultas,
          subject,
          description,
          file_path,
        ],
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

app.get("/api/pengaduan", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    res.set("Cache-Control", "private, max-age=60");
    const result = await pool.query(
      "SELECT *, count(*) OVER() AS total_count FROM pengaduan ORDER BY created_at DESC LIMIT $1 OFFSET $2",
      [limit, offset],
    );
    const total =
      result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
    res.json({
      data: result.rows.map(({ total_count, ...rest }) => rest),
      total: total,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ENDPOINT DANA ---
app.get("/api/dana", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    res.set("Cache-Control", "public, max-age=300");
    const result = await pool.query(
      "SELECT *, count(*) OVER() AS total_count FROM dana ORDER BY created_at DESC LIMIT $1 OFFSET $2",
      [limit, offset],
    );
    const total =
      result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
    res.json({
      data: result.rows.map(({ total_count, ...rest }) => rest),
      total: total,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/dana", upload.single("file"), async (req, res) => {
  const { judul, deskripsi, amount } = req.body;
  const file_path = req.file ? `/uploads/${req.file.filename}` : null;
  try {
    const result = await pool.query(
      "INSERT INTO dana (judul, deskripsi, amount, file_path) VALUES ($1, $2, $3, $4) RETURNING *",
      [judul, deskripsi, amount, file_path],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ENDPOINT BERITA ---
app.get("/api/berita", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 6;
  const offset = (page - 1) * limit;

  try {
    res.set("Cache-Control", "public, max-age=300");
    const result = await pool.query(
      "SELECT *, count(*) OVER() AS total_count FROM berita ORDER BY created_at DESC LIMIT $1 OFFSET $2",
      [limit, offset],
    );
    const total =
      result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
    res.json({
      data: result.rows.map(({ total_count, ...rest }) => rest),
      total: total,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/berita", upload.single("gambar"), async (req, res) => {
  const { judul, konten } = req.body;
  const file_path = req.file ? `/uploads/${req.file.filename}` : null;
  try {
    const result = await pool.query(
      "INSERT INTO berita (judul, konten, file_path) VALUES ($1, $2, $3) RETURNING *",
      [judul, konten, file_path],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ENDPOINT BUKU (Untuk About.html) ---
app.get("/api/buku", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    res.set("Cache-Control", "public, max-age=300");
    const result = await pool.query(
      "SELECT *, count(*) OVER() AS total_count FROM buku ORDER BY created_at DESC LIMIT $1 OFFSET $2",
      [limit, offset],
    );
    const total =
      result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
    res.json({
      data: result.rows.map(({ total_count, ...rest }) => rest),
      total: total,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/buku", upload.single("file"), async (req, res) => {
  const { judul, penulis } = req.body;
  const file_path = req.file ? `/uploads/${req.file.filename}` : null;
  try {
    const result = await pool.query(
      "INSERT INTO buku (judul, penulis, file_path) VALUES ($1, $2, $3) RETURNING *",
      [judul, penulis, file_path],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ENDPOINT PROKER ---
app.get("/api/proker", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    res.set("Cache-Control", "public, max-age=300");
    const result = await pool.query(
      "SELECT *, count(*) OVER() AS total_count FROM proker ORDER BY created_at DESC LIMIT $1 OFFSET $2",
      [limit, offset],
    );
    const total =
      result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
    res.json({
      data: result.rows.map(({ total_count, ...rest }) => rest),
      total: total,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/proker", upload.single("gambar"), async (req, res) => {
  const { nama_proker, departemen_id, deskripsi } = req.body;
  const file_path = req.file ? `/uploads/${req.file.filename}` : null;
  try {
    const result = await pool.query(
      "INSERT INTO proker (nama_proker, departemen_id, deskripsi, file_path) VALUES ($1, $2, $3, $4) RETURNING *",
      [nama_proker, departemen_id, deskripsi, file_path],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
