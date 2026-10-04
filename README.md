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
