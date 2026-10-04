# AYNIS Wedding Manager V4.1 — Team Roles

V4.1 menambahkan workspace bersama dan role Owner/Admin/Staff di atas Supabase Cloud.

## Role
- Owner: akses penuh dan Manajemen Pengguna.
- Admin: mengelola data operasional, tidak dapat mengelola pengguna/Owner.
- Staff: read-only.

## Cara menambahkan Admin
1. Owner login seperti biasa.
2. Klik avatar **AA** > Tim Aynis.
3. Masukkan email admin, pilih Admin, lalu Tambah Pengguna.
4. Admin membuka URL Aynis yang sama, memilih Buat / Aktivasi Akun dengan email undangan, lalu membuat password.
5. Setelah login, role diterapkan otomatis.

Database utama tetap Supabase. Jangan taruh secret/service role key di browser atau NEXT_PUBLIC env.
