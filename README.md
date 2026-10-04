# AYNIS Wedding Manager — V3.1 Core Finance

Penyempurnaan fokus 1–6 sebelum cloud database:

1. Detail Wedding berurutan: Data Pengantin → Paket → Isi Paket/Vendor → Pembayaran → Pengeluaran → Ringkasan.
2. Edit & hapus data Wedding, isi paket/vendor, pembayaran klien, dan riwayat pembayaran vendor dengan konfirmasi hapus.
3. Status otomatis: Booking → DP → Belum Lunas → Lunas, lalu dapat ditandai Selesai setelah lunas.
4. Pembayaran klien bertahap memiliki nama tahap, nominal, tanggal, catatan, edit, dan hapus.
5. Vendor memiliki riwayat pembayaran DP/cicilan/pelunasan per Wedding; status Belum Bayar / DP / Lunas otomatis.
6. Ringkasan keuangan lengkap: Harga Deal, Uang Masuk, Sisa Tagihan, Total Pengeluaran, Sudah Dibayar Vendor, Sisa Utang Vendor, Estimasi Untung, dan Uang Pegangan Sekarang.

Data tetap memakai localStorage V3 saat ini agar data lama tidak hilang. Supabase/cloud belum dipasang sesuai keputusan terakhir.

Upload isi ZIP ke root repo GitHub `aynis-wedding-manager` dengan struktur `app/`, `package.json`, dan `README.md`.
