
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL
);


CREATE TABLE IF NOT EXISTS pengurus (
    p_id VARCHAR(50) PRIMARY KEY,
    p_nama VARCHAR(100) NOT NULL,
    p_sosmed VARCHAR(100),
    p_web VARCHAR(255)
);


CREATE TABLE IF NOT EXISTS pengaduan (
    ad_id SERIAL PRIMARY KEY,
    ad_identitas VARCHAR(100) NOT NULL,
    ad_nim VARCHAR(20) NOT NULL,
    ad_kontak VARCHAR(20) NOT NULL,
    ad_jurusan VARCHAR(100) NOT NULL,
    ad_fakultas VARCHAR(100) NOT NULL,
    ad_subject VARCHAR(100) NOT NULL,
    ad_description TEXT NOT NULL,
    ad_bukti VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS berita (
    id SERIAL PRIMARY KEY,
    judul VARCHAR(255) NOT NULL,
    konten TEXT NOT NULL,
    gambar_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS buku (
    id SERIAL PRIMARY KEY,
    judul VARCHAR(255) NOT NULL,
    penulis VARCHAR(100),
    file_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


