# Lab TKJ

Brief pengguna: TKJ SMK Negeri 1 Mojokerto; miniatur lab 3D, pengalaman praktik komputer/jaringan, kamera bergerak maju antar meja, tanpa estetika hacker dan tanpa video berbayar.

ENERGY 2 / RHYTHM 3 / MOTION 3. Interpretasi: ruang belajar interaktif untuk siswa, dengan miniatur konseptual yang terang. Bukan representasi terverifikasi fasilitas sekolah.

- Kertas gading #f3f1e9 menjaga suasana kelas terang; tinta #233a3d untuk keterbacaan; biru perangkat #255c72 mengikat ilustrasi dan navigasi; kuning kabel #efc34b menandai filter aktif.
- Avenir Next dan fallback sistem memberi bentuk humanis dan keterbacaan katalog; serif pada kalimat pembuka memberi kontras editorial.
- Komposisi: pembuka tipografis, satu ruang 3D yang dipandu scroll, lalu katalog fungsional. Tidak menambahkan testimoni atau statistik.
- Canvas memproyeksikan geometri 3D asli dari kode dengan perspektif dan pengurutan kedalaman; tidak mengunduh gambar atau video.
- Gerakan kamera menjelaskan perpindahan workstation. Objek dan cahaya wajah ikut berubah perspektif sebagai lapisan sekunder dan lingkungan. Tidak ada loop dekoratif.
- Gerakan interaksi memakai easing cubic-bezier(.2,0,0,1), 120/180/300 ms; karakter Corporate yang responsif. Reduced motion menampilkan pandangan tetap, tombol manual tersedia.
- Scroll-world dipakai sebagai inspirasi perjalanan saja berdasarkan keputusan pengguna tanpa video; tidak mengklaim pipeline video seamless.
- Katalog berbentuk baris untuk memudahkan perbandingan nama, kategori, ukuran dan versi. Dialog hanya untuk detail dan upload.
- Bayangan hanya pada dialog untuk menandai elevasi. Sudut 3–8 px mempertahankan karakter peralatan lab.

## Revisi interaktif berbasis kode

Canvas proyeksi manual diganti Three.js WebGL dengan depth buffer, shadow map, hemisphere/daylight, material roughness, dan screen textures yang digambar lokal. Three.js disajikan dari dependency terkunci melalui rute server yang diizinkan secara eksplisit.

Ruang tidak lagi bergantung pada scroll panjang. Pemilihan area menggerakkan kamera ke meja; kontrol putar/zoom dan drag memberi eksplorasi bebas; motherboard/CPU/RAM/pendingin memiliki exploded view; koneksi LAN mengaktifkan LED dan pengiriman paket yang selesai dalam 2,2 detik. Semua tindakan memiliki tombol keyboard, status teks, dan versi tanpa gerakan.

Komposisi baru: navigasi area di atas, inspector kontekstual di kiri, ruang 3D di kanan. Di HP, ruang ditampilkan sebelum inspector agar objek tetap mendapat area cukup. Geometri, texture layar, dan label dibuat lewat kode tanpa gambar/video generatif.

Render dijadwalkan hanya untuk perubahan input, transisi kamera/komponen, hover, dan pengiriman paket. Render berhenti ketika tab tidak terlihat atau lab di luar viewport. Warna ring menandai target pilihan, bukan dekorasi berulang.
