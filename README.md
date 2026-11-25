# 31 - Oracle REST API with Express & Direct SQL

Lab ini menyelesaikan REST API Tabungan UMKM sesuai kontrak sesi 29 dengan SQL langsung (node-oracledb). Kerangka route, controller, service, validasi, Swagger UI, dan koleksi Bruno sudah tersedia. Yang dikerjakan: repository SQL (pagination, CRUD, mutasi), pemetaan error Oracle ke status HTTP, dan transfer dengan commit/rollback. Hasilnya: koleksi Bruno 26 request lulus semua. Setelah itu tim menambah endpoint untuk aplikasi ALP sendiri di Lab.

## Tujuan

1. Menulis query CRUD dan pagination `OFFSET ... FETCH` dengan bind variable.
2. Memetakan error Oracle ke status HTTP di satu error handler (ORA-00001 dan ORA-02292 menjadi 409).
3. Menjalankan transfer antar rekening dalam satu transaksi dengan commit dan rollback eksplisit.
4. Menguji API dengan koleksi Bruno dan curl untuk skenario berhasil, tidak ditemukan, dan input tidak valid.
5. Menambah endpoint untuk tabel ALP tim dengan pola yang sama, lengkap dengan test.

## Estimasi Waktu

Format sesi: **4 Demo + 1 Lab**. Di tiap Demo instruktur memperagakan, lalu peserta mengikuti langkah bernomor yang sama dari file *starter* (file di folder ini; bagian `TODO` sengaja belum lengkap). Demo 1 dan 2 inti sesi (nasabah dan mutasi): wajib selesai. Demo 3 (transfer commit/rollback) dan Demo 4 (test lengkap) penting. **Lab** adalah tugas tim yang menerapkan semuanya pada aplikasi ALP tim, dinilai dengan rubrik 100 poin dan cek otomatis. Tiap Demo punya **Tantangan tambahan** untuk yang selesai lebih cepat (tidak wajib).

| Bagian | Durasi di kelas (peraga + ikuti) |
| --- | --- |
| Demo 1 · Setup, baseline test, dan nasabah (pagination, CRUD, error 409) | ±75 menit (32 + 43) |
| Demo 2 · Mutasi rekening | ±20 menit (5 + 15) |
| Demo 3 · Transfer commit/rollback | ±45 menit (15 + 30) |
| Demo 4 · Test lengkap Bruno + curl | ±20 menit (8 + 12) |
| **Lab** · Endpoint ALP tim dengan test (lanjut setelah kelas) | ±35 menit |
| **Total** | **±195 menit** (+ pembuka dan penutup = 210) |

## Environment & Tools

Versi dikunci, dicek 22 Nov 2026.

| Tool | Versi | Catatan |
| --- | --- | --- |
| Node.js | 26 LTS (fallback 24 LTS) | |
| Container `oracle-alp`, user `ALP_DEV` | Oracle AI Database Free 23.26.4 | Dari sesi 21, di Docker Desktop (atau Rancher Desktop, CLI `docker` sama) |
| Paket npm | `express` 5.3.0, `oracledb` 26.0.0, `zod` 4.6.7, `swagger-ui-express` 5.0.1, `yaml` 2.9.1 | Dikunci di `package-lock.json` |
| Bruno | 4.3.x (aplikasi desktop, tanpa akun) | Koleksi ada di folder `bruno/` |
| curl | bawaan OS | PowerShell: ketik `curl.exe` |

### Cek kesiapan

| Item | Cara cek | Harus terlihat |
| --- | --- | --- |
| Oracle | `docker ps` | `oracle-alp ... (healthy)` |
| Bruno | Buka aplikasi Bruno | Layar Welcome, tanpa login |
| Lab sesi 30 | `.env` sesi 30 masih ada | Isinya dipakai lagi di langkah 1.2 |

## Struktur Repo

| Folder | Isi | Sudah terisi |
| --- | --- | --- |
| [`demo-1/`](demo-1/) | Demo 1 · Setup, Baseline Test, dan Nasabah | belum ada |
| [`demo-2/`](demo-2/) | Demo 2 · Mutasi Rekening | Demo 1 |
| [`demo-3/`](demo-3/) | Demo 3 · Transfer Commit/Rollback | Demo 1–2 |
| [`demo-4/`](demo-4/) | Demo 4 · Test Lengkap Bruno | Demo 1–3 |
| [`lab/`](lab/) | Lab · Endpoint ALP Tim dengan Test | Demo 1–3 |

Setiap folder adalah project lengkap yang berdiri sendiri. Konfigurasi lokal (`.env`), hasil install, dan repo Git dibuat per folder. Database yang dipakai tetap sama.

## Demo dan Lab

Demo dikerjakan **berpasangan**. Satu laptop menulis kode (driver), satu membaca kontrak dan README lalu mengecek (navigator). Tukar peran di awal setiap Demo. Lab dikerjakan per tim ALP.

### Target

| Bagian | Hasil |
| --- | --- |
| Demo 1 | API jalan, `/docs` terbuka, Bruno: 13 dari 26 request lulus; setelah nasabah dikerjakan folder `01 customers` lulus semua (21 dari 26) |
| Demo 2 | Folder `02 accounts` lulus (22 dari 26) |
| Demo 3 | Folder `03 transfers` lulus; rollback terbukti (26 dari 26) |
| Demo 4 | Seluruh koleksi lulus dua kali berturut-turut; tiga test curl sesuai tabel; satu assert sengaja dibuat gagal lalu dikembalikan |
| Lab | Endpoint ALP tim di `/api/lab` dengan folder test Bruno; skor `cek-lab.mjs` (maks. 80) + penilaian manual 20 |

### Studi Kasus

Tim frontend (sesi 37–48) dan mobile (sesi 49–56) akan memakai kontrak API Tabungan UMKM. Backend harus memenuhi kontrak itu persis: bentuk JSON, status code, dan kode error. Transfer harus aman: debit dan kredit berhasil berdua atau batal berdua. Semua data adalah data simulasi.

### Kriteria Selesai

- [ ] Bruno: 26 dari 26 request lulus, dua kali berturut-turut
- [ ] `GET /api/customers?page=2&pageSize=2&q=contoh&segment=UMKM` mengembalikan `"total":6` dan 2 data
- [ ] POST nasabah dengan email terpakai: `409 DUPLICATE`; DELETE nasabah berekening: `409 CUSTOMER_HAS_ACCOUNTS`
- [ ] Transfer berhasil mengubah dua saldo dan menambah dua mutasi `REF-SIM-T...-D` / `-K`
- [ ] Simulasi gagal setelah debit tidak mengubah saldo (rollback), lalu baris simulasi sudah dihapus
- [ ] Tidak ada nilai dari pemakai yang disambung ke teks SQL
- [ ] Assert yang sengaja dirusak di 4.3 sudah dikembalikan
- [ ] Lab: `cek-lab.mjs` menampilkan skor otomatis (target minimal 48 dari 80, setara 60%) dan folder `bruno/05 lab/` lulus

## Verifikasi & Expected Result

| Cek | Expected result |
| --- | --- |
| Daftar nasabah | `{ data, page, pageSize, total }`, `total` 12 tanpa filter, item ringkas (CustomerSummary) |
| Uang | Selalu string dua desimal (`"10000000.00"`) |
| Waktu | ISO 8601 berakhiran `+07:00` |
| Error | `{ "error": { "code", "message", "details"? } }` tanpa stack trace |
| Transfer | `201 { refNo, fromAccountId, toAccountId, amount, txnAt }`, `refNo` `REF-SIM-T` + angka mulai `100001` setelah reset |
| Laporan saldo cabang | 3 cabang (`75200000.00`, `63700000.00`, `79100000.00`), total `218000000.00` setelah reset |
| Arus kas `accountId=1&month=2026-03` | `transactions 4`, `totalIn 6900000.00`, `totalOut 1350000.00`, `net 5550000.00`, 3 kategori |
| Lab | `node challenge/cek-lab.mjs` menampilkan 6 baris kriteria dan subtotal otomatis maks. 80; `challenge/lab-tim.json` yang belum diisi memberi 0 |

## Troubleshooting

| Masalah / Error | Penyebab | Solusi |
| --- | --- | --- |
| `501 NOT_IMPLEMENTED` `TODO ... belum dikerjakan` | Bagian itu belum diisi | Kerjakan langkah sesuai nama TODO |
| Nasabah baru mendapat ID 21 (bukan 13) | Identity column memakai cache 20 nomor; setelah tabel dibuat ulang atau cache dibuang, nomor melompat | Normal, bukan error. Jangan menulis kode atau test yang mengandalkan ID berurutan |
| `500` + `ORA-00001: unique constraint (...) violated` di terminal | Mapping ORA-00001 belum ada | Langkah 1.8 |
| `NJS-097: no bind placeholder named ":CUSTID" was found in the statement text` | Nama di object binds tidak ada di SQL | Samakan nama (`:fromDate` di SQL ↔ `fromDate` di binds) |
| `NJS-098: 1 bind placeholders were used in the SQL statement but 2 bind values were provided` | Jumlah bind tidak cocok: ada nilai bind yang tidak dipakai di SQL, atau binds dikirim sebagai array yang kurang | Hanya masukkan ke binds nilai yang memang ada placeholder-nya |
| `ORA-03048: SQL reserved word 'ORDER' is not syntactically valid following '...0 ROWS FETCH NEXT 2 ROWS ONLY '` | `ORDER BY` ditulis setelah `OFFSET ... FETCH` | Urutan: `WHERE ... ORDER BY ... OFFSET ... FETCH NEXT ...` |
| Halaman 2 memuat data yang sama dengan halaman 1 | `OFFSET ... FETCH` tanpa `ORDER BY` (Oracle tidak menolak, urutan tidak pasti) | Selalu `ORDER BY` kolom unik, mis. `c.customer_id` |
| Nasabah baru tidak muncul di request berikutnya | Lupa `{ autoCommit: true }` | Tambahkan di `query()` untuk INSERT/UPDATE/DELETE |
| Transfer menggantung, request tidak pernah selesai | Statement transfer memakai `query()` (koneksi lain) yang menunggu baris yang sedang dikunci `FOR UPDATE` oleh koneksi transaksi | Semua statement transfer pakai `conn.execute()` dari `withTransaction` |
| `ORA-01843: An invalid month was specified.` | Tanggal tidak valid lolos ke SQL | Skema zod `z.iso.date()` sudah menolak sebagai 400; pakai `YYYY-MM-DD` |
| Bruno: `getaddrinfo ENOTFOUND` / `ECONNREFUSED` | Environment belum dipilih atau server mati | Pilih environment **local**, jalankan `npm run dev` |
| Request Bruno `Create customer` gagal 409 di run kedua | Run sebelumnya berhenti di tengah, data uji tertinggal | `npm run db:reset` |
| `cek-lab.mjs`: `Server tidak terjangkau di http://localhost:3000 (ECONNREFUSED)` | Server belum jalan atau port berbeda | `npm run dev`; isi `BASE_URL` kalau port bukan 3000 |
| `cek-lab.mjs`: `endpoint belum ada` | Alamat di `lab-tim.json` tidak sama dengan route di `lab.routes.js` (ingat awalan `/api/lab`) | Samakan `resource` dengan route |
| `cek-lab.mjs`: `Data uji tertinggal ... Hapus manual.` | `DELETE` belum jadi, atau detail tidak memuat penanda unik | Hapus baris dengan `id` itu, lalu perbaiki endpoint |
| `ORA-03049: SQL keyword 'RETURNING' is not syntactically valid following '...'` | `RETURNING` dipakai pada `INSERT ... SELECT` | Pakai `INSERT ... VALUES (...) RETURNING ... INTO` |
| `ORA-01017` saat start, server langsung berhenti | Password atau user di `.env` salah | Ctrl+C, perbaiki `.env`. Tiap start (dan tiap simpan file saat `npm run dev`) menambah satu gagal login; jangan diulang-ulang sebelum diperbaiki karena akun bisa terkunci |
| `Server gagal start di port 3000: listen EADDRINUSE: address already in use :::3000` | Server lain masih memakai port 3000 (mis. lab sesi 30, atau terminal lain) | Hentikan server lama (Ctrl+C di terminalnya), atau ganti `PORT` di `.env`; kalau port diganti, sesuaikan alamat curl, environment Bruno, dan `BASE_URL` |
| PowerShell: `Invoke-WebRequest : A parameter cannot be found that matches parameter name 'X'` atau `Missing an argument for parameter 'InFile'` | `curl` adalah alias PowerShell 5.1; pesan error bergantung opsi yang dipakai (`-X`, `-i`, `-H`, `-d`) | Ketik `curl.exe` |
| PowerShell: `Unrecognized token in source text` pada perintah dengan `@requests/...` | Argumen berawalan `@` tanpa kutip dibaca sebagai splatting | Apit dengan kutip: `-d "@requests/customer-baru.json"` |
| `npx` gagal: `ENOENT ... npm-cache\_npx\<hash>\package.json` | Proses `npx` sebelumnya terhenti di tengah (Ctrl+C, timeout) dan cache `_npx` rusak | PowerShell: `Remove-Item $env:LOCALAPPDATA\npm-cache\_npx -Recurse -Force`, lalu ulangi perintah. macOS/Linux: `rm -rf ~/.npm/_npx` |
| VS Code: dialog `Do you trust the authors of the files in this folder?` | Folder baru dibuka dalam Restricted Mode | Pilih **Trust Folder & Continue** |

## Cleanup

Hentikan server (Ctrl+C). Jalankan `npm run db:reset` kalau ingin mengembalikan data ke kondisi awal. Container tetap dipakai sesi 32–33.

Sesi 32 memperkenalkan Sequelize ORM dan relasi antar model; sesi 33 menulis ulang repository di lab ini dengan Sequelize sambil menjaga kontrak dan koleksi Bruno yang sama.
