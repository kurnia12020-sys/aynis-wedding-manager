# AYNIS Wedding Manager V4.31 — Searchable Vendor & Package

- Vendor picker now supports typing with autocomplete suggestions from Master Vendor.
- Package picker now supports typing with autocomplete suggestions from Master Harga.
- Selecting a saved vendor auto-fills name, category, and reference price.
- Selecting a saved package auto-fills the default deal price.
- Manual input remains available.

# AYNIS Wedding Manager V4.29 — Vendor Wedding Date

Perubahan:
- Bagian **VENDOR TERKAIT** sekarang menampilkan hari, tanggal, bulan, dan tahun wedding.
- Format contoh: **Selasa, 6 Oktober 2026**.
- Tanggal ditampilkan langsung di bawah judul **Semua Vendor Wedding**.
- Daftar semua vendor, kategori, nomor WhatsApp, tombol Hubungi, dan seluruh fitur V4.28 tetap dipertahankan.

# AYNIS Wedding Manager V4.28 — Client Notes in Main Summary

Perubahan dari V4.27:
- Menampilkan **Catatan Pengantin / Acara** langsung pada Rangkuman Klien / Informasi Utama.
- Catatan tampil penuh dan mudah dibaca tanpa membuka form Edit.
- Jika belum ada catatan, tampil placeholder "Belum ada catatan pengantin / acara.".
- Seluruh fitur V4.27 tetap dipertahankan, termasuk semua vendor terkait dan tombol WhatsApp.

# AYNIS Wedding Manager V4.9 — Admin Save & Multi-user Sync

Perbaikan V4.9:
- Admin dapat menambah dan menyimpan Wedding baru.
- Simpan Wedding menulis langsung ke Supabase sebelum form ditutup.
- Sinkronisasi realtime Owner/Admin untuk mengurangi data tertimpa antar perangkat.
- Finance Lock V4.2 tetap berlaku: Admin tidak melihat menu Keuangan/profit.
- Owner tetap memiliki akses penuh.

Upload seluruh isi project ke repository `aynis-wedding-manager`, commit ke `main`, lalu Vercel akan deploy otomatis.


## V4.9 Payment Schedule
- DP1 booking default Rp1.000.000
- DP2 otomatis menuju total 30% Harga Deal
- DP3 H-7 otomatis menuju total 70% Harga Deal
- Pelunasan otomatis H+2 setelah acara
- Owner dan Admin dapat edit nominal dan centang Sudah Dibayar/Belum
- Pengeluaran vendor dan profit tetap hanya Owner


## V4.9
- Cashback / Potongan per Wedding
- Harga Deal Bersih untuk jadwal DP, sisa tagihan, dan estimasi profit
- Konfirmasi sebelum menyimpan setiap pengeditan data yang sudah ada


## V4.21 Visual Refresh
Modern bridal premium palette: ivory, dusty rose, soft mauve, mocha, champagne accent. No business logic changes.

V4.23 - PWA / Add to Home Screen
- Manifest PWA + standalone mode
- AYNIS app icons (iPhone/Android)
- Apple Web App metadata
- Safe service worker registration
- No accounting/database logic changed


## V4.24 — Bridal Calendar Refresh
- Calendar-only visual refresh: softer bridal palette, clearer today/event/weekend states, more polished upcoming agenda cards.
- No accounting, Supabase, invoice, payment, or business-logic changes.


## V4.26 — Invoice Preview Payment Status
- Invoice kini menampilkan status tahapan pembayaran: DP 1 / Booking Tanggal, DP 2 / Target 30%, DP 3 / Target 70%, dan Pelunasan.
- Status otomatis membaca total pembayaran yang sudah tercatat: Lunas, Sebagian, atau Menunggu Pembayaran.
- Menampilkan tanggal pembayaran bila tersedia serta nominal terbayar dibanding target tahap.
- Tidak membuat transaksi baru; invoice hanya membaca data pembayaran yang sudah ada.


## V4.27 — Client Summary & Vendor WhatsApp
- Daftar Klien dibuat lebih informatif dengan progress pembayaran dan ringkasan deal.
- Detail Klien mendapat Rangkuman utama di bagian atas.
- Status DP1, DP2, DP3, dan Pelunasan tampil sebagai snapshot cepat.
- Semua vendor terkait ditampilkan tanpa dipotong.
- Nomor WhatsApp vendor diambil dari Master Vendor dan tombol Hubungi membuka WhatsApp langsung.
- Menu detail lama tetap dipertahankan, dengan tombol akses cepat agar navigasi lebih praktis di HP.


## V4.30 — Clean Vendor Wedding Info
- Vendor Terkait menampilkan nama pengantin, hari/tanggal lengkap, dan lokasi acara.
- Nomor WhatsApp vendor tidak ditampilkan di layar.
- Kontak vendor tetap tersedia melalui tombol Hubungi WhatsApp.
- Status vendor dan nominal vendor tidak ditampilkan pada bagian ini.


## V4.32 — Client Detail Refresh
- Merapikan hierarki visual Detail Klien.
- Header fokus identitas acara, rangkuman fokus pembayaran & paket.
- Catatan pengantin/acara dibuat menjadi kartu khusus yang lebih mudah dibaca.
- Tidak mengubah logika data maupun alur fitur V4.31.


## V4.34 — Invoice & Receipt Logo
- Added AYNIS ANIS MAKEUP logo asset at `public/aynis-logo.png`.
- Logo now appears in the Invoice/Kwitansi preview modal.
- Logo now appears in printed / Save as PDF Invoice and Kwitansi documents.
- Based on V4.33, preserving Scroll To Top and prior features.


## V4.35 — Import Klien dari Screenshot WhatsApp
- Tambah Wedding memiliki import screenshot WhatsApp.
- OCR berjalan di browser dengan Tesseract.js.
- Hasil mencoba mengisi nama, WhatsApp, tanggal, lokasi, paket, harga deal, dan catatan.
- Semua hasil tetap editable dan tidak disimpan sebelum tombol Simpan Wedding ditekan.
- Mendukung sampai 5 screenshot per import.


## V4.36 — Compact Home Wedding Grid
- Agenda Terdekat / Wedding Mendatang di Home menjadi grid 2 klien per baris.
- Card dibuat lebih compact dan modern dengan tanggal, status pembayaran, lokasi, dan progress pembayaran.
- Tap card membuka detail wedding.
- Semua fitur V4.35 dipertahankan.


## V4.37 — Compact Home Finance Summary
- Home financial summary cards remain 2 columns on phone screens.
- Reduced card height, padding, label size, value size and supporting text for a cleaner mobile dashboard.
- No calculation or data logic changes.
