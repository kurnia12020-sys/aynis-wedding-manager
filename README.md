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
