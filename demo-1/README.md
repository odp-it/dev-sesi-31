# Demo 1 · Setup, Baseline Test, dan Nasabah (ikuti ±43 menit)

> Folder ini project lengkap. Isinya starter: belum ada Demo yang diisi.
> Buka folder ini langsung di VS Code, lalu lakukan persiapan di [README utama](../README.md) (mis. salin `.env`, install, atau `git init`) **di folder ini**. Semua path relatif terhadap folder ini.

Tahap pertama (1.1–1.4, ±10 menit): setup dan baseline test. Tahap kedua (1.5–1.8, ±33 menit, setelah instruktur memperagakan nasabah dan error): nasabah.

## 1.1 Install (±2 menit)

Buka folder `demo-1` di VS Code dan terminal terintegrasi. Kalau muncul dialog `Do you trust the authors of the files in this folder?`, pilih **Trust Folder & Continue**. Peringatan `npm warn install-scripts ... oracledb` boleh diabaikan (di Windows PowerShell 5.1 tampil merah karena stderr).

```bash
npm ci
```

## 1.2 `.env` dan data (±3 menit)

Salin `.env.example` menjadi `.env` (`cp` atau `Copy-Item` di PowerShell), isi password `ALP_DEV`, lalu:

```bash
npm run db:reset
npm run dev
```

Yang harus terlihat: tabel ringkasan `3`, `12`, `15`, `125`, `'218000000.00'`, lalu:

```text
API Tabungan UMKM jalan di http://localhost:3000
Swagger UI: http://localhost:3000/docs
```

## 1.3 Buka kontrak di Swagger UI (±2 menit)

Buka `http://localhost:3000/docs` di browser. Ada 5 grup: Branches, Customers, Accounts, Transfers, Reports. Klik **GET /customers → Try it out → Execute**: respons `501` dengan pesan `TODO 1.5 belum dikerjakan`.

## 1.4 Jalankan koleksi Bruno (±3 menit)

1. Di Bruno: **Open Collection** → pilih folder `bruno/` di lab ini.
2. Di kanan atas, pilih environment **local**.
3. Klik kanan nama koleksi **Tabungan UMKM API → Run** → **Run Collection**.

Yang harus terlihat: 26 request, **13 lulus, 13 gagal**. Request yang gagal menjawab `501 Not Implemented`. Demo 1–3 mengubahnya menjadi lulus.

Alternatif tanpa aplikasi (opsional, butuh internet untuk download pertama; kalau gagal dengan `ENOENT ... npm-cache\_npx`, lihat Troubleshooting):

```bash
cd bruno
npx --yes @usebruno/cli@4.3.0 run --env local
```

**Nasabah: pagination, CRUD, error 409 (1.5–1.8, ±33 menit)**

Semua di `src/repositories/customer.repository.js`, kecuali 1.8.

## 1.5 Daftar nasabah dengan pagination (±11 menit)

```js
export async function findMany({ page, pageSize, q, segment }) {
  const { whereSql, binds } = buildFilter({ q, segment });
  const count = await query(`SELECT COUNT(*) AS total FROM customers c ${whereSql}`, binds);
  const result = await query(
    `${SELECT_CUSTOMER} ${whereSql}
      ORDER BY c.customer_id
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
    { ...binds, offset: (page - 1) * pageSize, limit: pageSize },
  );
  return { rows: result.rows.map(toSummary), total: Number(count.rows[0].TOTAL) };
}
```

`ORDER BY` wajib ada sebelum `OFFSET`: tanpa urutan yang pasti, halaman 2 bisa memuat baris yang sama dengan halaman 1.

Test:

```bash
curl "http://localhost:3000/api/customers?q=contoh&segment=UMKM&page=2&pageSize=2"
```

Yang harus terlihat: 2 nasabah (`Dewi Contoh`, `Maya Contoh`), hanya field ringkas (`id`, `cifNo`, `fullName`, `segment`, `branchCode`), `"page":2,"pageSize":2,"total":6`.

## 1.6 Buat nasabah (±8 menit)

```js
export async function create(data) {
  const result = await query(
    `DECLARE
       v_id customers.customer_id%TYPE;
     BEGIN
       INSERT INTO customers (cif_no, full_name, email, phone, segment, branch_id, created_at)
       VALUES ('CIF-SIM-BARU', :fullName, :email, :phone, :segment, :branchId,
               CAST(SYSTIMESTAMP AT TIME ZONE '+07:00' AS TIMESTAMP))
       RETURNING customer_id INTO v_id;
       UPDATE customers SET cif_no = 'CIF-SIM-' || LPAD(v_id, 4, '0') WHERE customer_id = v_id;
       :id := v_id;
     END;`,
    {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      segment: data.segment,
      branchId: data.branchId,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    },
    { autoCommit: true },
  );
  return result.outBinds.id;
}
```

Nomor CIF tidak dikirim pemakai (kontrak sesi 29): server membuatnya dari ID baru, mis. `CIF-SIM-0013`. ID dari identity column bisa melompat (mis. langsung 21) karena Oracle menyimpan cadangan 20 nomor di memori; itu normal, nomor tidak harus berurutan. Insert dan update CIF ada di satu blok PL/SQL, jadi satu kali kirim ke database. `autoCommit` bawaan node-oracledb adalah `false`; tanpa `{ autoCommit: true }`, data baru hilang saat koneksi kembali ke pool.

## 1.7 Ganti dan hapus nasabah (±4 menit)

```js
export async function update(id, data) {
  const result = await query(
    `UPDATE customers
        SET full_name = :fullName, email = :email, phone = :phone, segment = :segment, branch_id = :branchId
      WHERE customer_id = :id`,
    { id, fullName: data.fullName, email: data.email, phone: data.phone, segment: data.segment, branchId: data.branchId },
    { autoCommit: true },
  );
  return result.rowsAffected;
}

export async function remove(id) {
  const result = await query('DELETE FROM customers WHERE customer_id = :id', { id }, { autoCommit: true });
  return result.rowsAffected;
}
```

Service memakai `rowsAffected` `0` untuk menjawab `404 NOT_FOUND`.

## 1.8 Error Oracle jadi 409 (±10 menit)

Kirim nasabah yang sama dua kali sebelum 1.8 dikerjakan:

```bash
curl -X POST http://localhost:3000/api/customers -H "Content-Type: application/json" -d "@requests/customer-baru.json"
curl -X POST http://localhost:3000/api/customers -H "Content-Type: application/json" -d "@requests/customer-baru.json"
```

Request kedua menjawab `500 INTERNAL_ERROR`, dan terminal server mencetak `Error: ORA-00001: unique constraint (ALP_DEV.UQ_CUSTOMERS_EMAIL) violated on table ALP_DEV.CUSTOMERS columns (EMAIL)` diikuti `ORA-03301: (ORA-00001 details) row with column values (EMAIL:'eka.contoh@example.com') already exists` dan `ORA-06512: at line 4` (baris di blok PL/SQL). Database sudah menolak data ganda dengan benar; API-nya yang belum menerjemahkan.

Di `src/middlewares/error-handler.js`, ganti TODO 1.8 di dalam `switch`:

```js
    case 1: {
      const field = UNIQUE_FIELDS[constraintOf(err.message)];
      const message = `${field ?? 'Data'} sudah dipakai`;
      return new AppError(409, 'DUPLICATE', message, field ? [{ field, issue: 'duplicate', message }] : undefined);
    }
    case 2292:
      if (constraintOf(err.message) === 'FK_ACCOUNTS_CUSTOMER') {
        return new AppError(409, 'CUSTOMER_HAS_ACCOUNTS', 'Nasabah masih punya rekening, tidak bisa dihapus');
      }
      return new AppError(409, 'HAS_RELATED_DATA', 'Data masih dipakai tabel lain');
```

Ulangi request kedua dan hapus nasabah yang punya rekening:

```bash
curl -X POST http://localhost:3000/api/customers -H "Content-Type: application/json" -d "@requests/customer-baru.json"
curl -X DELETE http://localhost:3000/api/customers/1
```

Yang harus terlihat:

```json
{"error":{"code":"DUPLICATE","message":"email sudah dipakai","details":[{"field":"email","issue":"duplicate","message":"email sudah dipakai"}]}}
{"error":{"code":"CUSTOMER_HAS_ACCOUNTS","message":"Nasabah masih punya rekening, tidak bisa dihapus"}}
```

Jalankan folder Bruno **01 customers** (klik kanan folder → **Run**): 12 dari 12 lulus. Sebelum lanjut, jalankan `npm run db:reset` supaya nasabah dari test curl terhapus.

## Tantangan tambahan Demo 1 (opsional)

Kerjakan setelah 1.8. Bruno harus tetap 26 dari 26 lulus.

1. Tambahkan parameter `sort` ke `GET /api/customers`: nilai `id` (bawaan), `-id`, `fullName`, `-fullName`. Nilai `sort` tidak boleh disambung ke teks SQL: validasi dengan zod `z.enum(...)` lalu petakan ke potongan `ORDER BY` lewat objek tetap. Target: `?sort=-fullName&pageSize=3` memberi Wati, Sari, Rina; `?sort=id;drop` memberi 400.
2. Tulis dua request `PUT /api/customers/1` dengan body dari file baru di `requests/`: (a) `email` milik nasabah 2, (b) `branchId` 99. Tulis dulu status dan kode error yang kamu harapkan, baru jalankan. Kalau hasilnya berbeda dari tebakan, cari bagian `error-handler.js` yang menjelaskannya.
