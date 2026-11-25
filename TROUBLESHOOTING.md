# Troubleshooting

[Kembali ke README](README.md)

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
