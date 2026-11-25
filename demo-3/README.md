# Demo 3 · Transfer Commit/Rollback (ikuti ±30 menit)

> Folder ini project lengkap. Hasil Demo 1 sampai Demo 2 **sudah terisi** (catch-up). Kalau pekerjaanmu sendiri sudah jalan, boleh pakai punyamu.
> Buka folder ini langsung di VS Code, lalu lakukan persiapan di [README utama](../README.md) (mis. salin `.env`, install, atau `git init`) **di folder ini**. Semua path relatif terhadap folder ini.

## 3.1 Helper transaksi (±5 menit)

Di `src/db/oracle.js`:

```js
export async function withTransaction(work) {
  const conn = await pool.getConnection();
  try {
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.close();
  }
}
```

Semua statement transfer harus memakai `conn` yang sama. `query()` meminjam koneksi lain dari pool, jadi tidak ikut transaksi.

## 3.2 Repository transfer (±15 menit)

Di `src/repositories/transfer.repository.js`, isi `transfer()`:

```js
export async function transfer({ fromAccountId, toAccountId, amount, description }) {
  return withTransaction(async (conn) => {
    // 1. Kunci kedua rekening (urut account_id supaya dua transfer berlawanan arah tidak saling tunggu).
    const locked = await conn.execute(
      `SELECT account_id, account_no, status FROM accounts
        WHERE account_id IN (:fromId, :toId)
        ORDER BY account_id
        FOR UPDATE`,
      { fromId: fromAccountId, toId: toAccountId },
    );
    const from = locked.rows.find((r) => Number(r.ACCOUNT_ID) === fromAccountId);
    const to = locked.rows.find((r) => Number(r.ACCOUNT_ID) === toAccountId);
    if (!from) throw notFound(`Rekening asal ${fromAccountId}`);
    if (!to) throw notFound(`Rekening tujuan ${toAccountId}`);
    for (const acc of [from, to]) {
      if (acc.STATUS === 'DIBLOKIR') throw new AppError(409, 'ACCOUNT_BLOCKED', `Rekening ${acc.ACCOUNT_NO} diblokir`);
      if (acc.STATUS === 'DITUTUP') throw new AppError(409, 'ACCOUNT_CLOSED', `Rekening ${acc.ACCOUNT_NO} sudah ditutup`);
    }

    // 2. Debit: hanya berhasil kalau saldo cukup (dicek di database, bukan di JavaScript).
    const debit = await conn.execute(
      'UPDATE accounts SET balance = balance - :amount WHERE account_id = :id AND balance >= :amount',
      { amount, id: fromAccountId },
    );
    if (debit.rowsAffected === 0) {
      throw new AppError(409, 'INSUFFICIENT_BALANCE', `Saldo rekening ${from.ACCOUNT_NO} tidak cukup`);
    }

    // 3. Kredit.
    await conn.execute('UPDATE accounts SET balance = balance + :amount WHERE account_id = :id', { amount, id: toAccountId });

    // 4. Dua baris mutasi dengan nomor referensi dan jam yang sama.
    const meta = await conn.execute(
      `SELECT transfer_ref_seq.NEXTVAL AS seq,
              TO_CHAR(SYSTIMESTAMP AT TIME ZONE '+07:00', 'YYYY-MM-DD"T"HH24:MI:SS') AS txn_at
         FROM dual`,
    );
    const transferRef = `REF-SIM-T${meta.rows[0].SEQ}`;
    const txnAt = meta.rows[0].TXN_AT;
    await conn.execute(INSERT_TXN, {
      accountId: fromAccountId, txnType: 'TRANSFER_KELUAR', amount, txnAt,
      description: description ?? `Transfer ke ${to.ACCOUNT_NO}`, refNo: `${transferRef}-D`,
    });
    await conn.execute(INSERT_TXN, {
      accountId: toAccountId, txnType: 'TRANSFER_MASUK', amount, txnAt,
      description: description ?? `Transfer dari ${from.ACCOUNT_NO}`, refNo: `${transferRef}-K`,
    });

    return { refNo: transferRef, fromAccountId, toAccountId, amount: toMoney(amount), txnAt: `${txnAt}+07:00` };
  });
}
```

`amount` dikirim sebagai string (`"250000.00"`) dan dihitung oleh Oracle, jadi tidak pernah lewat float JavaScript.

## 3.3 Test transfer (±5 menit)

```bash
curl -X POST http://localhost:3000/api/transfers -H "Content-Type: application/json" -d "@requests/transfer-ok.json"
```

Yang harus terlihat (`txnAt` berbeda):

```json
{"refNo":"REF-SIM-T100001","fromAccountId":1,"toAccountId":2,"amount":"250000.00","txnAt":"2026-11-22T11:34:38+07:00"}
```

Lalu tiga request gagal: `transfer-saldo-kurang.json` (409 `INSUFFICIENT_BALANCE`), `transfer-rekening-diblokir.json` (409 `ACCOUNT_BLOCKED`), `transfer-rekening-tidak-ada.json` (404 `NOT_FOUND`).

## 3.4 Buktikan rollback (±5 menit)

1. `npm run db:reset`, lalu cek saldo: `curl http://localhost:3000/api/accounts/1` → `"balance":"14550000.00"`.
2. Di `transfer.repository.js`, tambahkan sementara baris ini tepat di atas komentar `// 3. Kredit.`:

   ```js
   throw new Error('Simulasi gagal setelah debit');
   ```

3. Kirim `transfer-ok.json` lagi. Respons `500 INTERNAL_ERROR`, terminal server mencetak `Error: Simulasi gagal setelah debit`.
4. Cek saldo rekening 1 lagi: tetap `"14550000.00"`. Debit yang sudah dijalankan dibatalkan oleh `rollback()`.
5. **Hapus baris simulasi**, simpan.

## Tantangan tambahan Demo 3 (opsional)

1. Bukti transfer aman saat bersamaan. Tulis `scripts/transfer-bersamaan.mjs` (Node memiliki `fetch`): baca saldo rekening 1 dan 2, kirim 20 `POST /api/transfers` bersamaan dengan `Promise.all` (10 dari 1 ke 2 dan 10 dari 2 ke 1, masing-masing `"100000.00"`), lalu baca saldo lagi. Target: semua `201`, tidak ada `500`, total saldo kedua rekening sama dengan sebelumnya (saldo masing-masing juga kembali karena arahnya seimbang). Tulis satu kalimat: kenapa kedua rekening dikunci dalam satu `SELECT ... FOR UPDATE ... ORDER BY account_id`?
2. Variasi 3.4. Sementara lempar `Error` setelah INSERT mutasi pertama (bukan setelah debit). Buktikan tiga hal tidak berubah: saldo rekening 1, jumlah mutasi rekening 1, dan jumlah mutasi rekening 2 (`GET /api/accounts/1/transactions`, lihat `total`). Hapus baris simulasi setelahnya.
