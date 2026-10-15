# Lab TKJ

Brief: landing page dan repository TKJ SMK Negeri 1 Mojokerto dengan miniatur lab pendidikan yang terang. Seluruh visual ruang dibuat melalui kode. Pengguna dapat memilih perjalanan scroll atau navigasi klik dari halaman pembuka hingga penutup.

ENERGY 2 / RHYTHM 3 / MOTION 3. Karakter gerakan: Corporate, responsif dan tenang. Tidak memakai video berbayar, estetika hacker, atau klaim fasilitas sekolah yang belum diverifikasi.

## Komposisi dan identitas

- Kertas gading #f3f1e9 dan ruang #eeeee5 menjaga suasana kelas terang; tinta #233a3d untuk teks; biru #255c72 menghubungkan perangkat dan heading; kuning #efc34b menunjukkan pilihan/aksi aktif.
- Avenir Next dengan fallback sistem untuk katalog dan kontrol; serif pada kalimat kunci memberikan kontras editorial.
- Enam segmen berurutan: pembuka → perakitan → jaringan → workstation → repository → penutup. Teks dan tindakan berada di samping satu ruang 3D persisten.
- Renderer tidak dipasang ulang antarsegi. Viewport mempertahankan ukuran agar kamera tidak meloncat saat kategori konten berubah.
- Pada HP, lab tetap terlihat di atas konten yang bergulir; mode, urutan perjalanan, dan kontrol kamera dapat diakses dengan sentuhan.
- Repository mempertahankan pencarian, kategori Ebook/Aplikasi/File, pengurutan, detail, upload admin, dan unduhan.

## Kamera dan perilaku

- Mode scroll memetakan posisi halaman pada enam keyframe dengan jeda pendek di tiap tujuan. Posisi diinterpolasi dalam koordinat orbital (target, radius, yaw, elevasi) agar kamera tidak memotong meja.
- Mode klik menahan kamera meskipun halaman digulir. Navigasi bawah, tautan antarsegmen, dan klik perangkat memindahkan kamera ke tujuan yang dipilih.
- Perpindahan mode dimulai dari pose saat ini. Kontrol putar/zoom masuk mode klik dan memiliki batas sudut serta jarak.
- Easing quintic memberikan kecepatan nol pada batas keyframe; interpolasi berbasis waktu menghaluskan input scroll cepat dan arah mundur.
- Reduced motion memakai mode klik dan perpindahan langsung. Tombol Hentikan gerakan membekukan gerakan otomatis, sementara navigasi eksplisit tetap berfungsi.
- Tidak ada render loop dekoratif. Render berjalan saat kamera/komponen berubah, ada paket data, atau highlight aktif. Tab tersembunyi menghentikan render.

## Model dan interaksi

Three.js WebGL menggunakan depth buffer, shadow map, hemisphere/daylight dan material roughness. Geometri bertepi halus, tekstur kayu lokal, isi PC, lampu kerja, kabel, port, stopkontak, laci, printer, buku, dan jam membuat pandangan dekat tetap memiliki detail.

Exploded view memperlihatkan hubungan motherboard/CPU/pendingin/RAM. Inspeksi CPU/RAM membuka komponen dan memberikan penjelasan. Kabel LAN mengaktifkan indikator link; satu paket bergerak hingga diterima switch. Monitor dapat dihidupkan/dimatikan. Lemari repository menghubungkan ruang fisik dengan katalog file.

Setiap interaksi objek memiliki alternatif tombol native. Status dijelaskan dengan teks, bukan warna saja. Model merupakan miniatur konseptual, bukan dokumentasi fasilitas sekolah.
