const dotenv = require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");
const nodemon = require("nodemon");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("GALAT KRITIS: JWT_SECRET tidak ditemukan di file .env!");
  process.exit(1);
}

const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Middleware
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

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
        connectionString: process.env.DB_URL?.replace(/\0/g, "").trim(),
        user: process.env.DB_USER?.replace(/\0/g, "").trim(),
        host: process.env.DB_HOST?.replace(/\0/g, "").trim(),
        database: process.env.DB_NAME?.replace(/\0/g, "").trim(),
        password: process.env.DB_PASSWORD?.replace(/\0/g, "").trim(),
        port: parseInt(process.env.DB_PORT?.replace(/\0/g, "")) || 5432,
      },
);

pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Gagal terhubung ke Database PostgreSQL:", err.message);
  } else {
    console.log(
      "Berhasil terhubung ke Database PostgreSQL pada:",
      res.rows[0].now,
    );
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

// Real-time Connection
io.on("connection", (socket) => {
  console.log("Client connected for real-time updates");
});

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
      io.emit("update_pengaduan");
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

app.get("/api/pengaduan", authenticateToken, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
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
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete("/api/pengaduan/:id", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM pengaduan WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rowCount > 0) {
      io.emit("update_pengaduan");
      res.json({ message: "Pengaduan dihapus" });
    } else {
      res.status(404).json({ message: "Pengaduan tidak ditemukan" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- ENDPOINT DANA ---
app.get("/api/dana", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
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
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post(
  "/api/dana",
  authenticateToken,
  upload.single("file"),
  async (req, res) => {
    const { judul, deskripsi, amount } = req.body;
    const file_path = req.file ? `/uploads/${req.file.filename}` : null;
    try {
      const result = await pool.query(
        "INSERT INTO dana (judul, deskripsi, amount, file_path) VALUES ($1, $2, $3, $4) RETURNING *",
        [judul, deskripsi, amount, file_path],
      );
      io.emit("update_dana");
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

app.delete("/api/dana/:id", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM dana WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rowCount > 0) {
      io.emit("update_dana");
      res.json({ message: "Data dana dihapus" });
    } else {
      res.status(404).json({ message: "Data dana tidak ditemukan" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- ENDPOINT BERITA ---
app.get("/api/berita", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 6;
  const bidang = req.query.bidang;
  const offset = (page - 1) * limit;

  try {
    let query = "SELECT *, count(*) OVER() AS total_count FROM berita"; // Base query
    const queryParams = [];
    let paramIndex = 1;

    if (bidang) {
      // Add WHERE clause only if 'bidang' is provided
      query += ` WHERE bidang = $${paramIndex++}`;
      queryParams.push(bidang);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);
    const total =
      result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
    res.json({
      data: result.rows.map(({ total_count, ...rest }) => rest),
      total: total,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post(
  "/api/berita",
  authenticateToken,
  upload.single("gambar"),
  async (req, res) => {
    const { judul, konten, bidang } = req.body;
    const file_path = req.file ? `/uploads/${req.file.filename}` : null;
    try {
      const result = await pool.query(
        "INSERT INTO berita (judul, konten, bidang, file_path) VALUES ($1, $2, $3, $4) RETURNING *",
        [judul, konten, bidang, file_path],
      );
      io.emit("update_berita");
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

app.delete("/api/berita/:id", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM berita WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rowCount > 0) {
      io.emit("update_berita");
      res.json({ message: "Berita dihapus" });
    } else {
      res.status(404).json({ message: "Berita tidak ditemukan" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- ENDPOINT BUKU (Untuk About.html) ---
app.get("/api/buku", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
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
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post(
  "/api/buku",
  authenticateToken,
  upload.single("file"),
  async (req, res) => {
    const { judul, penulis } = req.body;
    const file_path = req.file ? `/uploads/${req.file.filename}` : null;
    try {
      const result = await pool.query(
        "INSERT INTO buku (judul, penulis, file_path) VALUES ($1, $2, $3) RETURNING *",
        [judul, penulis, file_path],
      );
      io.emit("update_buku");
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

app.delete("/api/buku/:id", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM buku WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rowCount > 0) {
      io.emit("update_buku");
      res.json({ message: "Buku dihapus" });
    } else {
      res.status(404).json({ message: "Buku tidak ditemukan" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- ENDPOINT PROKER ---
app.get("/api/proker", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
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
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post(
  "/api/proker",
  authenticateToken,
  upload.single("gambar"),
  async (req, res) => {
    const { nama_proker, departemen_id, deskripsi } = req.body;
    const file_path = req.file ? `/uploads/${req.file.filename}` : null;
    try {
      const result = await pool.query(
        "INSERT INTO proker (nama_proker, departemen_id, deskripsi, file_path) VALUES ($1, $2, $3, $4) RETURNING *",
        [nama_proker, departemen_id, deskripsi, file_path],
      );
      io.emit("update_proker");
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

app.delete("/api/proker/:id", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM proker WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rowCount > 0) {
      io.emit("update_proker");
      res.json({ message: "Proker dihapus" });
    } else {
      res.status(404).json({ message: "Proker tidak ditemukan" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- ENDPOINT CAROUSEL ---
app.get("/api/carousel", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM carousel ORDER BY created_at DESC",
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post(
  "/api/carousel",
  authenticateToken,
  upload.single("gambar"),
  async (req, res) => {
    const { judul } = req.body;
    const file_path = req.file ? `/uploads/${req.file.filename}` : null;
    if (!file_path)
      return res.status(400).json({ error: "Gambar wajib diunggah" });

    try {
      const result = await pool.query(
        "INSERT INTO carousel (judul, file_path) VALUES ($1, $2) RETURNING *",
        [judul, file_path],
      );
      io.emit("update_carousel");
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

app.delete("/api/carousel/:id", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM carousel WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rowCount > 0) {
      io.emit("update_carousel");
      res.json({ message: "Slide carousel dihapus" });
    } else {
      res.status(404).json({ message: "Slide carousel tidak ditemukan" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ENDPOINT STATISTIK PERTUMBUHAN ---
app.get("/api/stats/growth", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT bulan, jumlah FROM stats_growth ORDER BY TO_DATE(bulan, 'YYYY-MM') ASC",
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/stats/growth", authenticateToken, async (req, res) => {
  const { bulan, jumlah } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO stats_growth (bulan, jumlah) VALUES ($1, $2)
       ON CONFLICT (bulan) DO UPDATE SET jumlah = EXCLUDED.jumlah
       RETURNING *`,
      [bulan, jumlah],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ENDPOINT EVENTS ---
app.get("/api/events", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 6;
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      "SELECT *, count(*) OVER() AS total_count FROM events ORDER BY tanggal DESC, created_at DESC LIMIT $1 OFFSET $2",
      [limit, offset],
    );
    const total =
      result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
    res.json({
      data: result.rows.map(({ total_count, ...rest }) => rest),
      total: total,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post(
  "/api/events",
  authenticateToken,
  upload.single("gambar"),
  async (req, res) => {
    const { judul, deskripsi, tanggal, lokasi } = req.body;
    const file_path = req.file ? `/uploads/${req.file.filename}` : null;
    try {
      const result = await pool.query(
        "INSERT INTO events (judul, deskripsi, tanggal, lokasi, file_path) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [judul, deskripsi, tanggal, lokasi, file_path],
      );
      io.emit("update_events");
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

app.delete("/api/events/:id", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM events WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rowCount > 0) {
      io.emit("update_events");
      res.json({ message: "Event dihapus" });
    } else {
      res.status(404).json({ message: "Event tidak ditemukan" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
