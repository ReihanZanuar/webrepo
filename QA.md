# Pemeriksaan revisi interaktif — 15 Oktober 2026

## Lab WebGL: PASS terverifikasi di Chrome

- Desktop 1440×1100: renderer WebGL berhasil; screenshot seluruh lab, exploded PC, dan jaringan ditinjau. Lantai tidak lagi menutupi perangkat seperti pada renderer canvas sebelumnya.
- Tombol area: Seluruh lab / Rakit komputer / Sambungkan jaringan / Meja belajar mengubah panel, pilihan aktif, dan tujuan kamera.
- PC: Angkat komponen → posisi terpisah; Satukan komponen → kembali; CPU dan RAM → penjelasan serta penanda objek.
- LAN: kirim paket dinonaktifkan sebelum tersambung; sambungkan → kabel tampil/link aktif; kirim → paket bergerak; status diterima setelah 2,2 detik; lepas → link terputus dan kirim dinonaktifkan.
- Workstation: matikan/nyalakan monitor mengubah status dan material layar.
- Kamera: tombol kiri/kanan, dekat/jauh, reset sudut, drag, dan panah/+ pada keyboard berfungsi. Klik objek melalui raycast memilih area yang sesuai.
- Gerakan: tombol pause/resume bekerja; prefers-reduced-motion mengaktifkan pause; pengiriman tetap selesai dengan status teks saat animasi dinonaktifkan.
- Mobile 390×844 dan 320×850: tidak ada horizontal overflow. Screenshot mobile ditinjau; kamera overview disesuaikan dengan bidang pandang lebih lebar.
- Fallback: Chrome dengan WebGL dinonaktifkan menampilkan bantuan, menonaktifkan kontrol 3D, dan tetap memuat repository.
- Console/browser: pengujian akhir tidak menemukan pageerror atau console error.
- Repository: muat ulang tetap bekerja; panel admin terbuka/tertutup. `npm test` lulus, termasuk otorisasi, validasi format/path, upload, checksum, download, dan persistensi setelah restart.
- Dependency: instalasi Three.js melaporkan 0 vulnerabilities. Modul disajikan dari rute allowlist lokal; tidak ada CDN/runtime remote script.

## Antislop untuk perubahan ini

- R-26 / R-32: PASS untuk kontrol lab baru; seluruh tindakan memiliki tombol native dan status teks. Klik objek memiliki alternatif tombol area; kamera memiliki kontrol keyboard.
- R-27: PASS; loading grafis, WebGL unavailable, dan context-lost memiliki pesan. Repository mempertahankan loading/empty/error.
- Purpose / Liveliness: PASS; geometri menggambarkan alat praktik, kamera mengarahkan ke tugas yang dipilih, exploded view menunjukkan hubungan komponen, dan paket menunjukkan jalur pengiriman. Keputusan dicatat di DESIGN.md.
- R-35: PASS untuk interaksi lab yang tercantum di atas, dengan pemeriksaan desktop/mobile. Tidak mengklaim seluruh aplikasi production-ready.

## Batas pemeriksaan

Safari/iOS nyata, pembaca layar, uji performa pada GPU kelas rendah, dan zoom browser 200% belum diuji. Pergerakan paket adalah simulasi visual, bukan koneksi jaringan sungguhan. Upload default masih memerlukan ADMIN_TOKEN. Tidak ada deployment atau perubahan koleksi file. Geometri adalah miniatur konseptual, bukan rekonstruksi fasilitas sekolah.

## Docker + SQLite — verifikasi terbaru

- PASS `npm test`: database SQLite sungguhan, tiga kategori baru, kategori Praktik ditolak, validasi upload, download, database/secret tidak terlayani publik, persistensi restart, migrasi Modul → Ebook dan Praktik → File, serta migrasi ulang tanpa duplikasi.
- PASS `docker compose config --quiet` dan build image Node 24 bookworm slim.
- PASS container berjalan non-root UID 1000, root filesystem read-only, volume `webrepo_repository-data` di `/data`; `.env` tidak masuk image.
- PASS Chrome pada localhost:8080: filter Semua/Ebook/Aplikasi/File, upload ebook PDF lewat panel Admin, detail metadata, dan download sesuai isi.
- PASS container dibuat ulang dengan `--force-recreate`; entri SQLite dan file yang sama tetap tersedia untuk download. Fixture test dihapus setelah verifikasi.
- PASS `docker compose ps`: running dan healthy, port 127.0.0.1:8080.
- Token admin acak dibuat di `.env` menggunakan setup, tidak dicetak ke log/chat. Preview Node lama port 4173 dihentikan agar tidak tertukar dengan database container.
- Menu Praktik yang dihapus adalah kategori repository dan pilihan upload. Lab interaktif tetap dipertahankan.
- Format ebook yang diuji/didukung adalah PDF; EPUB belum didukung. Backup/restore manual didokumentasikan, tetapi pemulihan dari backup ke host lain belum diuji.
