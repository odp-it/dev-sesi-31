# Lab · Endpoint ALP Tim dengan Test

[Persiapan](../README.md) · [Troubleshooting](../TROUBLESHOOTING.md)

> Hasil Demo 1 sampai Demo 3 sudah terisi di folder ini. Buka folder ini langsung di VS Code dan lakukan persiapan project di sini (`.env`, install, atau `git init`).

**Skenario.** Tim frontend aplikasi ALP tim akan mulai membuat halaman daftar dan form untuk satu data utama (mis. produk, anggota, atau tagihan). Tim lead meminta API untuk data itu dengan kontrak yang sama dengan API Tabungan UMKM: daftar berhalaman dengan satu filter, detail, tambah, dan hapus, error dalam satu bentuk, plus test yang bisa dijalankan siapa pun di tim.

Satu laptop per tim: laptop yang schema `ALP_DEV`-nya berisi tabel ALP tim (berawalan tim) dari Lab sesi 22. Kalau tabelnya belum ada, jalankan dulu file DDL tim sesi 22. `npm run db:reset` hanya membuat ulang empat tabel Tabungan UMKM; tabel berawalan tim tidak disentuh.

1. Pilih **satu tabel** tim yang punya primary key identity dan satu kolom teks `UNIQUE` (kode, SKU, email). Kalau belum ada kolom unik, tambahkan constraint `uq_` dengan `ALTER TABLE`.
2. Kerjakan TODO di `src/lab/` (`lab.schema.js`, `lab.repository.js`, `lab.routes.js`). Semua alamat di file itu diawali `/api/lab`. Kontraknya:

| Endpoint | Berhasil | Ditolak |
| --- | --- | --- |
| `GET /api/lab/<resource>?page&pageSize&<filter>` | `200 { data, page, pageSize, total }`, tiap item punya `id` (angka) | `pageSize` di atas 50: `400 VALIDATION_ERROR` |
| `GET /api/lab/<resource>/:id` | `200` data dengan `id` | `404 NOT_FOUND`, `400 VALIDATION_ERROR` (id bukan angka) |
| `POST /api/lab/<resource>` | `201` data baru dengan `id` | `400 VALIDATION_ERROR` + `details`, `409 DUPLICATE` |
| `DELETE /api/lab/<resource>/:id` | `204` | `404 NOT_FOUND` |

   Petunjuk: untuk `INSERT ... VALUES (...) RETURNING <primary key> INTO :id` (bukan di dalam blok PL/SQL), nilai baliknya array: `result.outBinds.id[0]`. Tambahkan nama constraint unik tim ke `UNIQUE_FIELDS` di `error-handler.js` supaya `details` menyebut field-nya. Uang dikirim sebagai string dua desimal (`toMoney()`).
3. Isi `challenge/lab-tim.json`:

| Isian | Arti |
| --- | --- |
| `resource` | Alamat daftar, mis. `/api/lab/<resource>` |
| `existingId` | `id` satu data yang sudah ada (angka tanpa kutip; cek lewat endpoint daftar) |
| `filterParam`, `filterValue` | Nama parameter filter dan nilai yang cocok dengan **sebagian** data (bukan semua) |
| `createBody` | Body `POST` yang valid. Wajib memuat `{{unik}}` (diganti 8 digit angka) di field unik yang tampil di detail |
| `invalidBody` | Body `POST` yang harus ditolak validasi |

4. Jalankan server (`npm run dev`), lalu di terminal kedua dari folder `lab` (perintah sama di PowerShell):

```bash
node challenge/cek-lab.mjs
```

   Skrip memanggil API tim, mencetak tabel poin (maks. 80) dan daftar yang belum terpenuhi. Alamat bawaan `http://localhost:3000`; kalau port berbeda, isi variabel `BASE_URL` (bash: `BASE_URL=http://localhost:3001 node challenge/cek-lab.mjs`; PowerShell: `$env:BASE_URL='http://localhost:3001'` lalu jalankan perintahnya). Data aman: skrip hanya menghapus baris yang dibuatnya sendiri. Kalau `DELETE` belum jadi, satu baris uji tertinggal dan skrip mencetak `id`-nya supaya bisa dihapus manual.
5. Buat folder test `bruno/05 lab/` (salin pola file `.bru` yang ada): minimal 6 request ber-`assert` yang mencakup status 200, 201, 400, 404, dan 409. Folder harus lulus dua kali berturut-turut, jadi data yang dibuat test dihapus lagi oleh test (simpan `id` baru dengan `bru.setVar(...)` di `script:post-response`, lihat `06 Create customer.bru`).

## Rubrik Lab (100 poin)

| Kriteria | Poin | Dinilai oleh | Indikator keberhasilan |
| --- | --- | --- | --- |
| Daftar dan pagination | 20 | `cek-lab.mjs` | Bentuk daftar sesuai kontrak, halaman 1 dan 2 berbeda, `pageSize` terlalu besar ditolak |
| Detail | 10 | `cek-lab.mjs` | `200`, `404 NOT_FOUND`, `400` untuk id bukan angka |
| Tambah data | 20 | `cek-lab.mjs` | `201` dengan `id` dan datanya bisa dibaca lagi; body tidak valid `400` + `details` |
| Data ganda | 10 | `cek-lab.mjs` | `409 DUPLICATE` tanpa teks `ORA-` |
| Filter aman | 10 | `cek-lab.mjs` | Filter menyaring data; `' OR '1'='1` menghasilkan 0 data atau `400` |
| Hapus | 10 | `cek-lab.mjs` | `204`, lalu `GET` dan `DELETE` ulang `404` |
| Test Bruno tim | 10 | Review tim lain | `05 lab`: minimal 6 request ber-assert (200, 201, 400, 404, 409), lulus dua kali berturut-turut |
| Lapisan dan bind | 5 | Review tim lain | SQL hanya di `lab.repository.js`, semua nilai pemakai lewat bind, tulis data dengan `autoCommit` atau `withTransaction` |
| Cocok data tim | 5 | Review tim lain | Nama field camelCase sesuai kamus data tim, uang string dua desimal, respons error tanpa stack trace |
| **Total** | **100** | | |

Target minimal 60 poin. Cek sendiri dengan `cek-lab.mjs` dan daftar rubrik di atas.

## Bonus Lab (opsional, maks. +10)

1. **Aksi bisnis dalam satu transaksi (+6).** Tambahkan satu endpoint `POST` di `/api/lab` yang menulis minimal dua tabel tim dengan `withTransaction`, dan menolak pelanggaran aturan bisnis dengan `409` dan kode error sendiri. Buktikan rollback: buat langkah kedua gagal, lalu tunjukkan tabel pertama tidak berubah.
2. **Laporan agregat (+4).** Tambahkan satu `GET /api/lab/reports/<nama>` dengan `JOIN` dan `GROUP BY` (angka dihitung di SQL), lengkap dengan satu request di `bruno/05 lab/`.
