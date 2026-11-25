# Demo 4 · Test Lengkap Bruno (ikuti ±12 menit)

> Folder ini project lengkap. Hasil Demo 1 sampai Demo 3 **sudah terisi** (catch-up). Kalau pekerjaanmu sendiri sudah jalan, boleh pakai punyamu.
> Buka folder ini langsung di VS Code, lalu lakukan persiapan di [README utama](../README.md) (mis. salin `.env`, install, atau `git init`) **di folder ini**. Semua path relatif terhadap folder ini.

## 4.1 Seluruh koleksi Bruno (±5 menit)

```bash
npm run db:reset
```

Run Collection di Bruno. Yang harus terlihat: **26 request lulus, 68/68 assertion**. Jalankan sekali lagi tanpa reset: tetap 26 lulus (koleksi membuat lalu menghapus datanya sendiri).

## 4.2 Tiga skenario dengan curl (±4 menit)

```bash
curl -i http://localhost:3000/api/customers/1
curl -i http://localhost:3000/api/customers/999
curl -i -X POST http://localhost:3000/api/customers -H "Content-Type: application/json" -d "@requests/customer-invalid.json"
```

| Skenario | Status | Kode error |
| --- | --- | --- |
| Berhasil | `200 OK` | |
| Tidak ditemukan | `404 Not Found` | `NOT_FOUND` |
| Input tidak valid | `400 Bad Request` | `VALIDATION_ERROR`, `details` berisi 5 field |

`-d "@requests/..."` membaca body dari file, jadi perintah yang sama jalan di bash dan PowerShell (`curl.exe`) tanpa urusan tanda kutip JSON. Tanda kutip di sekitar `@requests/...` wajib di PowerShell: argumen berawalan `@` tanpa kutip bisa dibaca sebagai splatting (`Unrecognized token in source text`). Di PowerShell ketik `curl.exe -i ...`; `curl -i` di Windows PowerShell 5.1 memberi `Missing an argument for parameter 'InFile'`.

## 4.3 Baca satu test, lalu buat gagal (±3 menit)

Buka `bruno/03 transfers/02 Transfer insufficient balance.bru` di VS Code. Satu file `.bru` berisi nama request (`meta`), method dan URL (`post`), body (`body:json`), dan aturan lulus (`assert`):

```text
assert {
  res.status: eq 409
  res.body.error.code: eq INSUFFICIENT_BALANCE
}
```

1. Ubah sementara `res.status: eq 409` menjadi `res.status: eq 200`, simpan, lalu Run Collection lagi. Yang harus terlihat: **25 lulus, 1 gagal**, 67/68 assertion, pesan `expected 409 to equal 200`.
2. Kembalikan menjadi `409`, jalankan request itu lagi: lulus (2/2 assertion).

Test yang tidak pernah bisa gagal tidak membuktikan apa pun. Pola yang sama dipakai di Lab.

## Tantangan tambahan Demo 4 (opsional)

Kalau sisa waktu, tambahkan endpoint baru, lengkap dengan test-nya.

1. Tambahkan `GET /api/accounts/:id/summary` yang mengembalikan `accountId`, `accountNo`, `balance`, `transactions` (jumlah mutasi), `totalIn` (`SETOR` + `TRANSFER_MASUK`), `totalOut` (`TARIK` + `TRANSFER_KELUAR`), dan `lastTxnAt` (waktu mutasi terakhir, ISO 8601 `+07:00`). Pola yang sama dengan endpoint lain: route, controller, service, repository. Semua angka dihitung di SQL, uang berupa string dua desimal. Target rekening 1 setelah `npm run db:reset`: `"transactions":12`, `"totalIn":"20900000.00"`, `"totalOut":"6350000.00"`; rekening 999 memberi 404; `abc` memberi 400.
2. Tambahkan dua request ke folder Bruno `02 accounts` (file `.bru`): summary rekening 1 (status 200, `accountNo`, uang berupa string dua desimal) dan summary rekening 999 (404 `NOT_FOUND`). Jangan mengandalkan jumlah mutasi di assertion (transfer di folder `03 transfers` mengubahnya pada run kedua). Target: 28 request lulus dua kali berturut-turut.
