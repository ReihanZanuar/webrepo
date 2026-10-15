# Lab TKJ — SMK Negeri 1 Mojokerto

Landing page lab WebGL dan repository Ebook, Aplikasi, File. Metadata disimpan di SQLite; isi file disimpan sebagai berkas di volume yang sama. Kategori Praktik dihapus dari repository. Area lab interaktif tetap tersedia.

## Jelajah lab

Pilih **Ikuti scroll** atau **Pilih dengan klik** di header. Satu lab 3D menghubungkan enam segmen dari pembuka, perakitan, jaringan, workstation, repository hingga penutup. Mode klik mempertahankan kamera saat halaman digulir; navigasi bawah atau klik perangkat menentukan tujuan. Tombol putar/zoom dan drag masuk ke mode klik. Mode tersimpan selama sesi browser.

Kamera memiliki batas sudut/jarak dan jalur orbital yang halus. CPU/RAM bisa diperiksa, komponen PC diangkat, kabel LAN disambungkan, paket simulasi dikirim, dan monitor dimatikan/dinyalakan. Reduced motion memilih mode klik dengan perpindahan langsung. Hentikan gerakan membekukan kamera otomatis tanpa menghilangkan navigasi eksplisit.

## Docker Compose

Memerlukan Docker Engine/OrbStack/Docker Desktop dan Compose v2.

```sh
npm run setup
docker compose up -d --build
```

Jika Node belum tersedia di host, buat `.env` dari `.env.example` dan isi `ADMIN_TOKEN` dengan kunci acak minimal 24 karakter. Contoh pembuat kunci: `openssl rand -hex 32`. Jangan masukkan kunci ke source code atau bagikan file `.env`.

Buka http://127.0.0.1:8080. Masukkan nilai `ADMIN_TOKEN` dari `.env` pada panel Admin untuk mengunggah file. `npm run setup` membuat token acak 64 karakter dan tidak menimpa `.env` yang sudah ada.

```sh
docker compose ps
docker compose logs --tail=50 web
docker compose stop
docker compose start
```

Port host diatur dengan `WEB_PORT` dalam `.env`; default 8080. Default `BIND_ADDRESS=127.0.0.1` hanya mengekspos ke komputer host. Untuk akses LAN, gunakan `BIND_ADDRESS=0.0.0.0` dan jalankan kembali `docker compose up -d`. Gunakan reverse proxy HTTPS sebelum mengirim kunci admin melalui jaringan publik.

Container memakai user non-root, root filesystem read-only, capability dihapus, dan healthcheck `/api/health`. Build hanya memasukkan source publik, server, database module, dan dependency. `.env`, database, backup, serta output QA dikecualikan dari image.

## Database dan mount

Named volume `repository-data` di-mount ke `/data`:

- `catalog.sqlite`: tabel `files` dengan ID, nama, judul, kategori, deskripsi, versi, ukuran, SHA-256, dan waktu upload.
- `catalog.sqlite-wal` / `catalog.sqlite-shm`: berkas transaksi SQLite bila sedang dipakai.
- `<UUID>.bin`: isi ebook/aplikasi/file. Nama asli dikembalikan saat download.

Database dibuat otomatis. Tidak memerlukan container database terpisah atau port SQL. SQLite sesuai deployment satu instance ini; jangan menjalankan beberapa replica yang berbagi database melalui NFS.

Untuk bind mount ke folder host, ganti `repository-data:/data` di compose dengan `./data:/data`. Pastikan direktori dapat ditulis UID/GID 1000 (user node); jangan gunakan chmod 777. Pada Linux, contoh untuk folder data milik proyek: `sudo chown -R 1000:1000 ./data`.

Bila memakai metadata JSON dari versi lama, letakkan JSON dan `.bin` bersama di mount tersebut sebelum startup. Server mengimpor otomatis ke SQLite: Modul → Ebook, Praktik → File, Aplikasi tetap. JSON lama dipertahankan, ID tidak diduplikasi saat restart. Jika berkas hilang atau ukurannya tidak sesuai, startup gagal agar migrasi tidak diam-diam kehilangan data.

## Backup dan restore

Hentikan aplikasi agar database dan file konsisten, lalu salin seluruh `/data`, bukan hanya SQLite:

```sh
docker compose stop web
mkdir -p backups
docker compose cp web:/data ./backups/repository
docker compose start web
```

Gunakan direktori tujuan backup yang baru untuk setiap snapshot. Jangan menjalankan `docker compose down -v` kecuali memang ingin menghapus seluruh volume.

Restore ke volume yang sudah diinisialisasi: hentikan service, salin isi backup ke `/data`, pastikan file dimiliki user node (UID 1000), lalu start. Untuk pemindahan server, opsi paling sederhana adalah restore snapshot ke direktori host dan gunakan bind mount seperti di atas. Jangan menimpa database aktif.

## Menjalankan tanpa Docker

Memerlukan Node.js 24+:

```sh
npm ci
npm run setup
node --env-file=.env server.mjs
```

Buka http://127.0.0.1:4173. Local server menyimpan database dan file pada `data/`. `DATA_DIR` dapat mengarah ke folder lain. `HOST` default 127.0.0.1, `PORT` default 4173. `npm start` juga bisa dipakai dengan ADMIN_TOKEN yang diekspor lewat environment.

## Format file dan batas

PDF (ebook), ZIP, EXE, MSI, TXT; maksimum 100 MB per upload. Format diperiksa melalui signature sederhana; pemeriksaan ini bukan antivirus. Berkas hanya dilayani sebagai attachment dan tidak dieksekusi. Repository bersifat publik untuk baca/download, penambahan file memerlukan kunci admin. Upload gagal tanpa token minimal 24 karakter.

Belum tersedia edit/hapus koleksi, akun multiadmin, pemindaian malware, dan dukungan EPUB. Ilustrasi sekolah bersifat konseptual. Belum menjadi publikasi resmi sekolah.

## Pengujian

`npm test` menguji kontinuitas jalur kamera dan pemetaan scroll, serta SQLite sungguhan, tiga kategori, penolakan kategori Praktik, token tidak valid, signature/path tidak valid, download, proteksi berkas internal, persistensi, dan migrasi JSON idempoten. `docker compose config --quiet` memvalidasi Compose tanpa mencetak token. Lihat QA.md untuk pemeriksaan container/browser.
# Webrepo
