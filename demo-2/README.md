# Demo 2 · Mutasi Rekening (ikuti ±15 menit)

> Folder ini project lengkap. Hasil Demo 1 **sudah terisi** (catch-up). Kalau pekerjaanmu sendiri sudah jalan, boleh pakai punyamu.
> Buka folder ini langsung di VS Code, lalu lakukan persiapan di [README utama](../README.md) (mis. salin `.env`, install, atau `git init`) **di folder ini**. Semua path relatif terhadap folder ini.

## 2.1 Filter tanggal, kategori, dan pagination

Di `src/repositories/account.repository.js`:

```js
export async function findTransactions(accountId, { from, to, category, page, pageSize }) {
  const where = ['t.account_id = :accountId'];
  const binds = { accountId };
  if (from) {
    where.push(`t.txn_at >= TO_DATE(:fromDate, 'YYYY-MM-DD')`);
    binds.fromDate = from;
  }
  if (to) {
    where.push(`t.txn_at < TO_DATE(:toDate, 'YYYY-MM-DD') + 1`);
    binds.toDate = to;
  }
  if (category) {
    where.push('t.category = :category');
    binds.category = category;
  }
  const whereSql = `WHERE ${where.join(' AND ')}`;
  const count = await query(`SELECT COUNT(*) AS total FROM transactions t ${whereSql}`, binds);
  const result = await query(
    `SELECT t.txn_id, t.account_id, t.txn_type, t.category, t.amount, ${isoWib('t.txn_at')} AS txn_at,
            t.description, t.ref_no
       FROM transactions t ${whereSql}
      ORDER BY t.txn_at, t.txn_id
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
    { ...binds, offset: (page - 1) * pageSize, limit: pageSize },
  );
  return { rows: result.rows.map(toTransaction), total: Number(count.rows[0].TOTAL) };
}
```

Yang disambung ke teks SQL hanya potongan tetap buatan kode (`t.category = :category`). Nilai dari pemakai tetap lewat bind.

```bash
curl "http://localhost:3000/api/accounts/1/transactions?from=2026-03-01&to=2026-03-31"
```

Yang harus terlihat: `"total":4`, mutasi `REF-SIM-000096`, `REF-SIM-000104`, `REF-SIM-000110`, `REF-SIM-000112`, `amount` berupa string dua desimal (`"3450000.00"`), `txnAt` berakhiran `+07:00`.

## Tantangan tambahan Demo 2 (opsional)

Parameter ini belum ada di kontrak sesi 29: coba di salinan atau kembalikan setelahnya (`git restore`, atau hapus perubahan) supaya Bruno tetap 26 dari 26.

1. Tambahkan filter `type` (`SETOR`, `TARIK`, `TRANSFER_KELUAR`, `TRANSFER_MASUK`) ke `GET /api/accounts/:id/transactions` (zod `z.enum`, bind variable). Target untuk rekening 1: `?type=SETOR` memberi `"total":7`; dengan `from=2026-03-01&to=2026-03-31` memberi `"total":2`; `?type=BAYAR` memberi 400.
2. Tambahkan `order=asc|desc` (bawaan `asc`). Nilai tidak boleh disambung ke teks SQL: pilih `ASC` atau `DESC` dari dua nilai tetap. Target: `?order=desc&pageSize=3` memberi `REF-SIM-000112`, `REF-SIM-000110`, `REF-SIM-000104`.
