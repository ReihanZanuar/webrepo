# Lab TKJ — SMK Negeri 1 Mojokerto

Landing page lab WebGL dan repository Ebook, Aplikasi, File. Metadata disimpan di SQLite; isi file disimpan sebagai berkas di volume yang sama. Kategori Praktik dihapus dari repository. Area lab interaktif tetap tersedia.

## Jelajah lab

Satu lab 3D menghubungkan enam segmen dari pembuka, perakitan, jaringan, workstation, repository hingga penutup. Satu gestur roda mouse/trackpad atau satu swipe memindahkan satu nomor. Halaman dan kamera menyelesaikan perpindahan selama 800 ms lalu berhenti tepat di tujuan; momentum tidak melompati beberapa nomor. Konten panjang, termasuk daftar repository, digulir dalam panelnya. Page Down/Up dan panah atas/bawah juga dapat digunakan. Navigasi bawah dan klik perangkat menyediakan pilihan tujuan langsung. Kontrol kamera ringkas berada di kanan atas, tepat di bawah tombol Hentikan gerakan. Setelah putar/zoom atau drag, scroll berikutnya tetap melanjutkan perjalanan.

Pada Workstation, monitor kiri menampilkan tautan Proxmox Debian, Proxmox Windows, dan AI TKJ. Masuk ke komputer mendekatkan kamera; hover/fokus memperlihatkan alamat tujuan dan klik membuka tab baru. Kembali ke meja atau memilih segmen lain mengembalikan perjalanan. Tautan tetap tersedia sebagai daftar inline jika WebGL gagal.

Repository dimulai pada kategori Aplikasi. Filter menggerakkan tiga loker: 01 Ebook, 02 Aplikasi, dan 03 File. Hanya loker kategori terpilih yang terbuka; Semua membuka ketiganya. Loker tetap tertutup sebelum tiba di Repository dan menutup kembali saat meninggalkannya. Reduced motion mempertahankan pilihan loker tanpa animasi.

Kamera memiliki batas sudut/jarak dan jalur orbital yang halus. CPU/RAM bisa diperiksa, komponen PC diangkat, kabel LAN disambungkan, paket simulasi dikirim, dan monitor dimatikan/dinyalakan. Reduced motion memakai perpindahan langsung. Hentikan gerakan menghentikan animasi; perpindahan tujuan tetap berfungsi tanpa animasi.

Navigasi progres tampil sebagai overlay transparan di bagian bawah area 3D. Keenam nomor dapat diklik, nama tujuan aktif ditampilkan pada desktop, dan HP memakai nomor agar tetap ringkas. Keterangan miniatur berada di segmen penutup.

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

Port host diatur dengan `WEB_PORT` dalam `.env`; default 8080. Default `BIND_ADDRESS=127.0.0.1` hanya mengekspos ke komputer host. Untuk akses LAN, gunakan `BIND_ADDRESS=0.0.0.0` dan jalankan kembali `docker compose up -d`.

### Nginx Reverse Proxy & SSL (HTTPS)

Service `nginx` tersedia melalui profil opsional `https`. Startup standar hanya menjalankan aplikasi di port 8080, sehingga tidak gagal ketika sertifikat lokal belum tersedia. Untuk HTTPS dengan sertifikat Let's Encrypt / Certbot:
- Atur `DOMAIN=namadomain.com` dan letakkan `fullchain.pem` serta `privkey.pem` di folder `certs/` proyek (atau atur `CERTS_DIR`).
- Sertifikat di-mount secara read-only ke container Nginx (`/etc/nginx/certs`).
- Setelah kedua berkas sertifikat tersedia, jalankan `docker compose --profile https up -d --build`. Nginx me-redirect HTTP (port 80) ke HTTPS (port 443) dan meneruskan lalu lintas ke service `web:4173`.
- Batas Nginx adalah `client_max_body_size 10g`; buffering request dimatikan agar unggahan diteruskan sebagai stream. Antarmuka mengirim bagian 16 MiB. Timeout proxy untuk pengiriman/pemrosesan diatur 900 detik per permintaan.
- Bila log menunjukkan `cannot load certificate`, periksa nama kedua berkas di `CERTS_DIR` sebelum menjalankan profil HTTPS. Sertifikat tidak dibuat otomatis oleh aplikasi.

Container memakai user non-root, root filesystem read-only, capability dihapus, dan healthcheck `/api/health`. Build hanya memasukkan source publik, server, database module, dan dependency. `.env`, database, backup, serta output QA dikecualikan dari image.

## Database dan mount

Named volume `repository-data` di-mount ke `/data`:

- `catalog.sqlite`: tabel `files` dengan ID, nama, judul, kategori, deskripsi, versi, ukuran, SHA-256, dan waktu upload.
- `catalog.sqlite-wal` / `catalog.sqlite-shm`: berkas transaksi SQLite bila sedang dipakai.
- `<UUID>.bin`: isi ebook/aplikasi/file. Nama asli dikembalikan saat download.
- `.uploads/`: bagian file dan metadata sesi upload yang belum selesai; sesi kedaluwarsa setelah 24 jam. Bagian yang sudah diterima dapat dilanjutkan setelah server restart.

Database dibuat otomatis. Tidak memerlukan container database terpisah atau port SQL. SQLite sesuai deployment satu instance ini; jangan menjalankan beberapa replica yang berbagi database melalui NFS.

Pada proyek ini nama volume Compose biasanya `webrepo_repository-data`. Lihat melalui Docker Desktop/OrbStack pada bagian Volumes; `catalog.sqlite` berada di volume tersebut, bukan di direktori source. Untuk salinan yang dapat dibuka dengan aplikasi SQLite, gunakan langkah backup di bawah agar berkas WAL ikut tersalin secara konsisten.

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

PDF (ebook), ZIP, EXE, MSI, TXT; maksimum **10 GB per file** (10 × 1024³ byte). Upload browser dibagi menjadi bagian 16 MiB dengan progres, pembatalan, dan maksimal tiga percobaan ulang otomatis untuk bagian yang gagal. Setelah kegagalan, tombol Unggah file melanjutkan posisi yang sudah tersimpan selama file dan metadata di form tetap sama. Setelah halaman dimuat ulang, pilih dan unggah file kembali. Sesi server bertahan hingga 24 jam dan dibatasi tiga upload tertunda. Server memeriksa ruang kosong sebelum membuat sesi.

Seluruh bagian ditulis ke disk; file 10 GB tidak ditampung sekaligus dalam RAM. Setelah lengkap, server memeriksa signature, menghitung SHA-256 melalui stream, lalu memindahkan file ke koleksi dan mencatat metadata SQLite. Format diperiksa melalui signature sederhana; pemeriksaan ini bukan antivirus. Berkas hanya dilayani sebagai attachment dan tidak dieksekusi. Repository bersifat publik untuk baca/download, penambahan file memerlukan kunci admin. Upload gagal tanpa token minimal 24 karakter.

Belum tersedia edit/hapus koleksi, akun multiadmin, pemindaian malware, dan dukungan EPUB. Ilustrasi sekolah bersifat konseptual. Belum menjadi publikasi resmi sekolah.

## Pengujian

`npm test` menguji kontinuitas jalur kamera, pemetaan scroll, upload bertahap di atas 100 MB, penerimaan batas 10 GB/penolakan di atasnya, restart di tengah upload, posisi ulang, checksum/download, pembatalan, staging privat, batas sesi, SQLite, tiga kategori, otorisasi, signature/path, persistensi dan migrasi JSON idempoten. `docker compose --profile https config --quiet` memvalidasi Compose tanpa mencetak token. Lihat QA.md untuk pemeriksaan container/browser.
# Webrepo
