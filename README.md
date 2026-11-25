# 31 - Oracle REST API with Express & Direct SQL

Lab ini menyelesaikan REST API Tabungan UMKM sesuai kontrak sesi 29 dengan SQL langsung (node-oracledb). Kerangka route, controller, service, validasi, Swagger UI, dan koleksi Bruno sudah tersedia. Yang dikerjakan: repository SQL (pagination, CRUD, mutasi), pemetaan error Oracle ke status HTTP, dan transfer dengan commit/rollback. Hasilnya: koleksi Bruno 26 request lulus semua. Setelah itu tim menambah endpoint untuk aplikasi ALP sendiri di Lab.

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

## Studi Kasus

Tim frontend (sesi 37–48) dan mobile (sesi 49–56) akan memakai kontrak API Tabungan UMKM. Backend harus memenuhi kontrak itu persis: bentuk JSON, status code, dan kode error. Transfer harus aman: debit dan kredit berhasil berdua atau batal berdua. Semua data adalah data simulasi.

## Bantuan

- [TROUBLESHOOTING.md](TROUBLESHOOTING.md): pesan error dan cara memperbaikinya.
- [CHECKLIST.md](CHECKLIST.md): hasil yang harus terlihat dan kriteria selesai.

## Cleanup

Hentikan server (Ctrl+C). Jalankan `npm run db:reset` kalau ingin mengembalikan data ke kondisi awal. Container tetap dipakai sesi 32–33.

Sesi 32 memperkenalkan Sequelize ORM dan relasi antar model; sesi 33 menulis ulang repository di lab ini dengan Sequelize sambil menjaga kontrak dan koleksi Bruno yang sama.
