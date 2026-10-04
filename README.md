# AYNIS Wedding Manager V4.0 Cloud Data

Versi ini memindahkan penyimpanan utama AYNIS Wedding Manager dari perangkat ke Supabase.

## Fitur cloud
- Akun Owner dengan email + password Supabase Auth.
- Data Wedding, Vendor, Master Harga, pembayaran, pengeluaran, kalender, dan riwayat pembayaran vendor tersimpan di Supabase.
- Login dengan akun yang sama di perangkat lain menampilkan data yang sama.
- Data V3/V3.2 yang masih ada di localStorage otomatis diimpor saat akun pertama kali dipakai jika cloud masih kosong.
- localStorage tetap dipakai sebagai cache/backup lokal, bukan sumber utama.
- RLS aktif agar setiap akun hanya dapat membaca dan menulis datanya sendiri.

## Environment Vercel
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Keduanya sudah disiapkan di project Vercel Aynis.
