# AYNIS Wedding Manager V3.0 — Finance Flow

Versi utama pembukuan wedding Aynis Anis Makeup.

## Struktur GitHub

```text
aynis-wedding-manager/
├── app/
│   ├── globals.css
│   ├── layout.js
│   └── page.js
├── package.json
└── README.md
```

## Fitur V3.0
- Home: ringkasan Harga Deal, Uang Masuk, Sisa Tagihan, Pengeluaran, Estimasi Untung, Uang Pegangan.
- Wedding: data pengantin, paket, pembayaran, isi paket/vendor, dan ringkasan keuntungan.
- Harga vendor bersifat referensi di database Vendor dan bisa diubah untuk setiap wedding.
- Pembayaran klien dapat dicatat berkali-kali.
- Total pengeluaran dan keuntungan dihitung otomatis.
- Kalender otomatis dari tanggal wedding.
- Vendor: kontak, kategori, alamat, harga referensi, catatan.
- Data disimpan di localStorage browser dan membaca/migrasikan data versi sebelumnya bila ada.

## Deploy
Ekstrak ZIP lalu upload **isi** paket ini ke root repository GitHub `aynis-wedding-manager` dan commit ke branch `main`. Vercel akan deploy otomatis.
