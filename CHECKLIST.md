# Checklist

[Kembali ke README](README.md)

## Kriteria Selesai

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
