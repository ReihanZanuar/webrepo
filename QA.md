# Catatan verifikasi

## Tautan pada permukaan monitor - 16 Oktober 2026

- Menggantikan dialog layanan versi sebelumnya: menu sekarang berada pada bidang layar monitor kiri dengan transformasi perspektif berdasarkan kamera. Hover/fokus menampilkan pop-up nama/alamat sesuai tautan; klik membuka tab baru. Monitor kanan mempertahankan diagram jaringan.
- PASS Chrome Docker lokal: tiga tujuan URL tepat dan window.opener null (request eksternal diintersep untuk fixture, tidak menguji server tujuan), menu tidak memakai dialog/backdrop, kamera mendekat/kembali, hover per layanan, fokus keyboard/Escape, daya monitor, serta perubahan perspektif setelah kamera diputar.
- PASS desktop 1440×1000, tablet 761×900, HP 390×844 dan 320×500: menu berada dalam viewport dan di antara kontrol atas serta navigasi bawah; target pada tampilan dekat minimal 44 px, tidak ada overflow horizontal. Konteks browser sentuh menguji tap AI TKJ dan kembali ke meja.
- PASS navigasi ke repository mengakhiri tampilan dekat, menu tersembunyi di segmen lain, scroll tetap melanjutkan perjalanan, reduced motion tanpa transisi, fallback tautan inline ketika WebGL tidak tersedia. Tidak ada pageerror. Screenshot final ditinjau pada desktop/HP dan disimpan di output/qa-2026-10-16/tkj-monitor-*.png.
- Uji memakai Chrome; Safari/iOS fisik dan ketersediaan HTTPS layanan tujuan belum diverifikasi. Catatan dialog di bawah adalah hasil versi terdahulu yang sudah diganti.

## Pilihan layanan komputer - 16 Oktober 2026

- PASS Docker lokal / Chrome: Masuk ke komputer dan klik objek workstation membuka dialog; kamera mendekati monitor dan kembali ke posisi semula setelah ditutup. Escape dan tombol kembali memulihkan fokus ke tombol pembuka.
- PASS tiga tujuan HTTPS: tkjskanesa.my.id:8081 (Proxmox Debian), tkjskanesa.my.id:8082 (Proxmox Windows), curiosity.mymo.my.id (AI TKJ). Popup diuji dengan request interception; URL tepat, tab baru, opener null. Ketersediaan, sertifikat, dan login layanan eksternal belum diperiksa.
- PASS keyboard, scroll/PageDown tidak mengubah segmen maupun scroll halaman ketika dialog terbuka; link dapat dicapai dengan Tab. Reduced motion dan WebGL unavailable tetap menyediakan menu.
- PASS desktop 1440×1000, tablet 761×900, HP 390×844 dan 320×500: dialog dalam viewport, tidak ada overflow horizontal, target tautan lebih dari 44 px, tombol kembali tetap berada di atas area isi yang bergulir. Screenshot desktop dan HP ditinjau, tanpa pageerror. Safari/iOS fisik belum diuji.
- PASS pemeriksaan sintaks JS, git diff --check, rebuild web Docker, reload Nginx, dan kesamaan CSS HTTPS lokal dengan source final. Bukti screenshot: output/qa-2026-10-16/tkj-computer-*.png.

## Progres perjalanan sebagai overlay - 16 Oktober 2026

- Navigasi enam nomor dan garis progres dipindahkan ke lapisan overlay yang mengikuti batas area 3D. Latar transparan gading dengan blur lokal dan bayangan tipis menjaga keterbacaan; desktop menampilkan nama tujuan aktif, HP memakai nomor. Footer keterangan miniatur dipindahkan ke penutup.
- PASS Chrome 1440×1000, 1000×900, 761×900, 390×844, 320×844, 720×500, dan 320×500: overlay berada dalam area 3D, tidak bertabrakan dengan kontrol kamera, semua target minimal 44 px, dan tidak ada horizontal overflow. Tinggi minimum area 3D pada layar pendek disesuaikan menjadi 184 px untuk menjaga jarak kedua kelompok kontrol.
- PASS enam tujuan melalui klik, navigasi keyboard, scroll satu segmen, kontrol kamera, indikator tujuan aktif, serta progres 80% pada repository. Lapisan overlay tetap bisa diklik di atas panel repository pada tablet sempit. Tidak ada pageerror.
- PASS pemeriksaan pada Docker final untuk target klik desktop/tablet/HP dan label repository. View desktop diperlebar menjadi 44 derajat setelah area gambar diperpanjang; screenshot desktop dan HP ditinjau.
- PASS pemeriksaan sintaks, `git diff --check`, build image, reload Nginx, dan kesamaan stylesheet yang disajikan melalui HTTPS dengan source yang diuji. Screenshot disimpan pada `output/qa-2026-10-16/tkj-overlay-*.png`. Safari/iOS nyata belum diuji.

## Kontrol kamera ringkas - 16 Oktober 2026

- Pemilih mode di header dan penyimpanan preferensi mode dihapus. Preferensi lama `click` pada sessionStorage tidak lagi memengaruhi navigasi.
- Kontrol putar kiri/kanan, zoom masuk/keluar, dan Reset berada tepat di bawah Hentikan gerakan di kanan atas. Tombol 36 px pada desktop dan 44 px pada HP; tooltip berada di bawah kelompok kontrol. Header HP dikurangi menjadi 78 px.
- PASS Chrome desktop 1440×1000 dan mobile 390/320×844: tidak ada selector mode, overflow horizontal, atau tombol kamera di luar viewport. Kelima tombol kamera, keyboard, scroll setelah putar/zoom, pause, reduced motion, pencarian repository, dan dialog admin diuji tanpa pageerror. Memilih ulang tujuan yang sudah aktif tidak menahan scroll selama transisi kosong.
- PASS pemeriksaan sintaks dan `git diff --check`; image web dibangun ulang, Nginx dimuat ulang, dan modul kamera yang dilayani melalui HTTPS sama dengan source yang diuji.
- Screenshot lokal: `output/qa-2026-10-16/tkj-compact-desktop.png`, `tkj-compact-mobile-390.png`, dan `tkj-compact-mobile-320.png`. Safari/iOS nyata belum diuji.

## HTTPS Docker lokal aktif - 16 Oktober 2026

- Sertifikat untuk `tkjskanesa.my.id` dan kunci privat dipasang pada `certs/` yang diabaikan Git dan konteks build Docker. Direktori dibatasi mode 700 dan berkas mode 600. Domain diatur pada `.env` tanpa memasukkan secret ke source.
- PASS kecocokan public key sertifikat/kunci, verifikasi hostname dan rantai sertifikat melalui trust store OpenSSL. Masa berlaku sertifikat 15 Oktober 2026 hingga 13 Januari 2027.
- PASS `nginx -t`; profil `https` diaktifkan. Nginx berjalan pada port 80/443 dan web tetap healthy pada port 8080.
- PASS HTTPS lokal menggunakan `curl --resolve tkjskanesa.my.id:443:127.0.0.1` dengan verifikasi TLS aktif: `/api/health` menghasilkan HTTP 200 dan `ssl_verify_result=0`. HTTP port 80 menghasilkan 301 ke `https://tkjskanesa.my.id/`.
- Pengujian ini diarahkan ke Docker lokal, bukan deployment atau DNS domain publik. Pembaruan otomatis sertifikat belum disiapkan. Karena kunci privat telah dikirim melalui chat, pengguna disarankan menerbitkan ulang sertifikat dengan kunci baru.

## Upload 10 GB dan scroll per nomor - 16 Oktober 2026

- PASS `npm test`: empat pengujian. Upload API 128 MiB + 137 byte diterima melalui bagian 16 MiB, dilanjutkan setelah restart, diselesaikan sekali meskipun completion diulang, lalu diunduh dengan ukuran dan SHA-256 yang sama. Batas tepat 10 × 1024³ byte diterima saat membuat sesi; satu byte di atasnya ditolak. File 10 GB penuh belum ditransfer selama QA.
- PASS otorisasi untuk create/status/PUT/DELETE/complete, penolakan path dan signature yang salah, posisi bagian yang tidak sesuai, bagian di atas 16 MiB, total melebihi deklarasi, staging privat, serta batas tiga sesi pada empat permintaan bersamaan.
- PASS Chrome browser dengan penyimpanan uji terisolasi: unggah ZIP 110 MiB melalui panel Admin; bagian pertama sengaja digagalkan dan dicoba ulang otomatis sampai sukses. File di atas 10 GB ditolak di browser; Batalkan upload membuang sesi tanpa menambah koleksi.
- PASS satu roda mouse → satu segmen, rangkaian momentum trackpad → satu segmen, delta besar → satu segmen, scroll mundur, serta posisi halaman parsial yang kembali tepat ke tujuan. Halaman dan kamera tiba pada indeks integer yang sama. Navigasi enam tujuan, keyboard Page Down/Home, dan mode klik tetap berfungsi.
- PASS swipe mobile 390×844 dan navigasi scroll dengan reduced motion. Screenshot desktop/mobile dan panel upload ditinjau; tidak ada horizontal overflow pada ukuran yang diperiksa.
- PASS pemeriksaan pada image Docker final di port 8080: konfigurasi upload melaporkan batas 10 GB, perpindahan satu scroll, semua tujuan, posisi segmen dipertahankan saat resize ke mobile, inspeksi CPU/RAM, sambungkan/kirim/lepas LAN, monitor, kontrol kamera, pause, repository, admin, dan riwayat browser. Tidak ada pageerror.
- PASS container `webrepo-web-1` healthy. SQLite `/data/catalog.sqlite` dibaca langsung dari container secara read-only; koleksi tetap kosong. Volume `webrepo_repository-data` dipertahankan; fixture upload hanya memakai direktori sementara.
- Nginx sebelumnya terus restart karena `/etc/nginx/certs/fullchain.pem` tidak tersedia. Service tersebut dihentikan dan dipindahkan ke profil opsional `https`. Setelah `fullchain.pem` dan `privkey.pem` dipasang di `CERTS_DIR`, aktifkan melalui `docker compose --profile https up -d`. Startup standar berjalan di port 8080.
- PASS validasi Compose termasuk profil HTTPS, pemeriksaan sintaks, dan `git diff --check`. Nginx dikonfigurasi `client_max_body_size 10g`, request streaming, timeout 900 detik. Sertifikat tidak masuk konteks build Docker. HTTPS dengan sertifikat nyata belum diuji pada mesin ini.

Batas pemeriksaan: Safari/iOS nyata, reverse proxy eksternal/domain publik, transfer 10 GB penuh, serta performa GPU kelas rendah belum diuji. Screenshot lokal ada di `output/qa-2026-10-16/` (diabaikan Git).

## Perjalanan lab tersambung — 16 Oktober 2026

- PASS `npm test`: 3 pengujian, meliputi kontinuitas enam tujuan kamera, pemetaan scroll dengan tinggi segmen berbeda, serta integrasi SQLite/upload/validasi/persistensi/migrasi yang sudah ada.
- PASS Chrome pada Docker `http://127.0.0.1:8080`: scroll maju dan mundur melalui keenam segmen memakai satu canvas. Mode klik menahan posisi kamera saat halaman digulir; pergantian kembali ke scroll mengikuti posisi halaman saat itu.
- PASS navigasi antarsegmen, tautan langsung `#repository`, riwayat kembali/maju, pilihan perangkat melalui raycast, drag, tombol putar/reset, dan kontrol keyboard. Ukuran viewport 3D sama ketika berpindah antarsegi, termasuk pada lebar tablet 1000 px.
- PASS PC: angkat/satukan komponen, periksa CPU/RAM dan penjelasannya. LAN: sambungkan, kirim paket, status diterima. Monitor: mati/nyala. Pause: kamera berhenti meskipun halaman digulir dan kembali mengikuti setelah dilanjutkan.
- PASS reduced motion: mode klik, navigasi tanpa interpolasi kamera, dan pengiriman paket langsung selesai dengan status teks. Tombol LAN dapat dijangkau pada layar 320×750; padding gulir menjaga kontrol dari panel 3D dan navigasi tetap.
- PASS layout Chrome 1440×1000, 390×844, 320×750, dan layar pendek 720×500; tidak ada horizontal overflow. Framing pembuka, close-up perakitan/jaringan/workstation/repository, serta screenshot mobile ditinjau. Reflow 720×500 bukan pengujian zoom browser 200% yang sebenarnya.
- PASS fallback Chrome dengan WebGL dinonaktifkan: pesan bantuan tampil, kontrol 3D dinonaktifkan, pencarian/reload repository dan akses admin tetap tersedia.
- PASS pencarian, filter, pengurutan, reload, buka/tutup dialog admin; rangkaian pengujian browser pada container selesai tanpa pageerror atau console error.
- PASS `docker compose up -d --build`; container `webrepo-web-1` healthy di port 8080. Mount tetap `webrepo_repository-data` pada `/data`.
- PASS pemeriksaan sintaks modul dan `git diff --check`. Screenshot lokal disimpan di `output/qa-2026-10-16/` (diabaikan Git).

Batas pemeriksaan: Safari/iOS nyata, pembaca layar, zoom browser 200%, dan performa pada GPU kelas rendah belum diuji. Pengiriman paket adalah simulasi visual; miniatur merupakan ilustrasi konseptual fasilitas belajar.

## Riwayat revisi interaktif — 15 Oktober 2026

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
