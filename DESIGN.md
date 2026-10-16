# Lab TKJ

Brief: landing page dan repository TKJ SMK Negeri 1 Mojokerto dengan miniatur lab pendidikan yang terang. Seluruh visual ruang dibuat melalui kode. Perjalanan mengikuti scroll dari pembuka hingga penutup, dengan navigasi tujuan langsung melalui urutan di bawah atau klik perangkat.

ENERGY 2 / RHYTHM 3 / MOTION 3. Karakter gerakan: Corporate, responsif dan tenang. Tidak memakai video berbayar, estetika hacker, atau klaim fasilitas sekolah yang belum diverifikasi.

## Komposisi dan identitas

- Kertas gading #f3f1e9 dan ruang #eeeee5 menjaga suasana kelas terang; tinta #233a3d untuk teks; biru #255c72 menghubungkan perangkat dan heading; kuning #efc34b menunjukkan pilihan/aksi aktif.
- Avenir Next dengan fallback sistem untuk katalog dan kontrol; serif pada kalimat kunci memberikan kontras editorial.
- Enam segmen berurutan: pembuka → perakitan → jaringan → workstation → repository → penutup. Teks dan tindakan berada di samping satu ruang 3D persisten.
- Renderer tidak dipasang ulang antarsegi. Viewport mempertahankan ukuran agar kamera tidak meloncat saat kategori konten berubah.
- Pada HP, lab tetap terlihat di atas konten yang bergulir; urutan perjalanan dan kontrol kamera dapat diakses dengan sentuhan. Header hanya berisi identitas sekolah dan navigasi repository/admin.
- Repository mempertahankan pencarian, kategori Ebook/Aplikasi/File, pengurutan, detail, upload admin, dan unduhan.

## Kamera dan perilaku

- Perjalanan memakai enam tujuan diskret. Satu gestur memindahkan satu nomor selama 800 ms; kamera dan halaman memakai progres quintic yang sama, lalu berhenti tepat di tujuan. Event momentum trackpad dikelompokkan hingga ada jeda 220 ms. Konten panjang bergulir dalam panel agar halaman tidak menetap di sela segmen.
- Navigasi bawah, tautan antarsegmen, dan klik perangkat memindahkan kamera ke tujuan yang dipilih. Pilihan mode di header dihapus sesuai revisi pengguna.
- Kontrol putar/zoom ringkas berada tepat di bawah Hentikan gerakan di kanan atas. Ukuran tombol desktop 36 px, HP 44 px; tooltip berada di bawah kelompok kontrol. Scroll berikutnya mengembalikan sudut ke framing tujuan.
- Urutan perjalanan dan progres menjadi overlay mengambang di bagian bawah area 3D. Latar gading transparan dengan blur hanya pada komponen ini menjaga keterbacaan di atas geometri; bayangan tipis memisahkan target klik dari miniatur. Enam nomor selalu tampil, nama tujuan aktif tampil pada desktop, dan progres kuning mengikuti kamera. Semua target minimal 44 px. Footer provenance berada di penutup; tidak ada bar kaku yang mengambil bagian bawah layar. Bidang pandang desktop diperlebar menjadi 44 derajat untuk menjaga framing saat area 3D diperpanjang.
- Easing quintic memberikan kecepatan nol pada batas keyframe; interpolasi berbasis waktu menghaluskan input scroll cepat dan arah mundur.
- Reduced motion memakai perpindahan langsung. Tombol Hentikan gerakan menghentikan animasi; navigasi tujuan tetap berfungsi tanpa animasi.
- Tidak ada render loop dekoratif. Render berjalan saat kamera/komponen berubah, ada paket data, atau highlight aktif. Tab tersembunyi menghentikan render.

## Model dan interaksi

Three.js WebGL menggunakan depth buffer, shadow map, hemisphere/daylight dan material roughness. Geometri bertepi halus, tekstur kayu lokal, isi PC, lampu kerja, kabel, port, stopkontak, laci, printer, buku, dan jam membuat pandangan dekat tetap memiliki detail.

Exploded view memperlihatkan hubungan motherboard/CPU/pendingin/RAM. Inspeksi CPU/RAM membuka komponen dan memberikan penjelasan. Kabel LAN mengaktifkan indikator link; satu paket bergerak hingga diterima switch. Monitor dapat dihidupkan/dimatikan. Lemari repository menghubungkan ruang fisik dengan katalog file.

Setiap interaksi objek memiliki alternatif tombol native. Status dijelaskan dengan teks, bukan warna saja. Model merupakan miniatur konseptual, bukan dokumentasi fasilitas sekolah.

## Layanan workstation

Ketiga layanan berada pada permukaan monitor kiri. Tautan HTML native diproyeksikan ke empat sudut bidang layar 3D sehingga perspektif, posisi, zoom, dan putaran tetap mengikuti monitor. Tekstur menu yang sama mempertahankan tampilan dari segmen lain. Pemeriksaan occlusion menyembunyikan interaksi jika monitor terhalang; mematikan daya menyembunyikan menu.

Masuk ke komputer atau klik perangkat mendekatkan kamera; Kembali ke meja mengembalikannya. Tidak ada modal maupun backdrop. Pada HP, masuk memperbesar viewport lab agar ketiga target tetap minimal 44 px. Memilih segmen lain mengakhiri tampilan dekat. Hover/fokus menyorot satu layanan dan memunculkan nama serta alamat di pop-up kecil 160 ms; Escape menutup pratinjau, lalu kembali ke meja. Pada sentuhan, alamat sudah terlihat di setiap baris. Pause dan reduced motion memindahkan kamera langsung.

Proxmox Debian, Proxmox Windows, dan AI TKJ memakai tautan HTTPS tetap sesuai domain/port pengguna, dibuka di tab baru dengan noopener/noreferrer. Tidak ada login, iframe, atau proxy layanan melalui server repository. Menu tetap tersedia ketika WebGL gagal.
