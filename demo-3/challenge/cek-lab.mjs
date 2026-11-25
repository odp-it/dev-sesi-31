// Cek otomatis Lab sesi 31 (80 poin). Hanya memakai Node bawaan.
//   node challenge/cek-lab.mjs                      (membaca challenge/lab-tim.json)
//   node challenge/cek-lab.mjs <file-config.json>
// Server harus sudah jalan (npm run dev). Alamat bawaan http://localhost:3000; ganti dengan BASE_URL.
// Aman untuk data: skrip hanya menghapus baris yang dibuatnya sendiri, yaitu yang detailnya memuat penanda {{unik}}.
import { readFileSync } from 'node:fs';

const BASE = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const file = process.argv[2] ?? new URL('./lab-tim.json', import.meta.url);

function stop(message, code = 2) {
  console.log(message);
  process.exit(code);
}

let raw;
try {
  raw = readFileSync(file, 'utf8').replace(/^﻿/, '');
} catch {
  stop(`File konfigurasi tidak ditemukan: ${file}`);
}
let cfg;
try {
  cfg = JSON.parse(raw);
} catch (err) {
  stop(`Konfigurasi bukan JSON yang valid: ${err.message}`);
}

const rows = [];
function criterion(name, max) {
  const row = { name, max, score: 0, notes: [] };
  rows.push(row);
  // check(poin, syarat, catatan kalau gagal)
  row.check = (points, ok, note) => {
    if (ok) row.score += points;
    else row.notes.push(note);
    return ok;
  };
  return row;
}
const c1 = criterion('1. Daftar dan pagination', 20);
const c2 = criterion('2. Detail: 200, 404, 400', 10);
const c3 = criterion('3. Tambah data: 201, 400', 20);
const c4 = criterion('4. Data ganda jadi 409', 10);
const c5 = criterion('5. Filter aman (bind)', 10);
const c6 = criterion('6. Hapus: 204 lalu 404', 10);

function report() {
  console.log(`Cek Lab Sesi 31 - ${cfg.resource}`);
  console.log(`${'Kriteria'.padEnd(34)}Poin`);
  console.log('-'.repeat(44));
  for (const r of rows) console.log(`${r.name.padEnd(34)}${String(r.score).padStart(2)} / ${r.max}`);
  console.log('-'.repeat(44));
  const total = rows.reduce((sum, r) => sum + r.score, 0);
  console.log(`${'Subtotal otomatis'.padEnd(34)}${String(total).padStart(2)} / 80`);
  const failed = rows.filter((r) => r.notes.length);
  if (failed.length) {
    console.log('\nBelum terpenuhi:');
    for (const r of failed) for (const n of r.notes) console.log(`- ${r.name.slice(0, 2)} ${n}`);
  }
  return total;
}

if (/ISI[_-]/.test(JSON.stringify(cfg))) {
  for (const r of rows) r.notes.push('challenge/lab-tim.json masih berisi isian ISI_...');
  report();
  process.exit(1);
}
if (!JSON.stringify(cfg.createBody ?? {}).includes('{{unik}}')) {
  stop('createBody wajib memuat {{unik}} di field yang unik dan tampil di detail (mis. SKU atau kode).');
}

async function call(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* respons kosong atau bukan JSON */
  }
  // 404 dari notFoundRoute berarti endpoint belum dibuat, bukan "data tidak ada".
  const noRoute = res.status === 404 && (!json?.error || String(json.error.message).startsWith('Endpoint '));
  return { status: res.status, json, text, noRoute, code: json?.error?.code };
}
const got = (r) => (r.noRoute ? 'endpoint belum ada' : `${r.status}${r.code ? ` ${r.code}` : ''}`);
const is = (r, status, code) => !r.noRoute && r.status === status && (!code || r.code === code) && !r.text.includes('ORA-');

try {
  await call('GET', '/health');
} catch (err) {
  stop(`Server tidak terjangkau di ${BASE} (${err.cause?.code ?? err.name}). Jalankan npm run dev, cek BASE_URL.`);
}

const R = cfg.resource;
const unik = Date.now().toString().slice(-8);
const fill = (value) => JSON.parse(JSON.stringify(value).replaceAll('{{unik}}', unik));
const leftovers = [];

try {
  // 1. Daftar dan pagination
  const list = await call('GET', R);
  const listOk = c1.check(8,
    is(list, 200) && Array.isArray(list.json?.data) && list.json.data.length > 0 && list.json.data.every((d) => Number.isInteger(d.id)) &&
      [list.json.page, list.json.pageSize, list.json.total].every(Number.isInteger),
    `GET ${R} harus 200 { data: [{ id, ... }], page, pageSize, total } dan berisi data (dapat ${got(list)})`);
  const all = listOk ? list.json.total : 0;
  const p1 = await call('GET', `${R}?page=1&pageSize=1`);
  const p2 = await call('GET', `${R}?page=2&pageSize=1`);
  c1.check(8,
    listOk && p1.json?.data?.length === 1 && p2.json?.data?.length === 1 && p1.json.data[0].id !== p2.json.data[0].id &&
      p1.json.total === all && p2.json.total === all,
    'page=1 dan page=2 dengan pageSize=1 harus berisi satu data berbeda dengan total yang sama (butuh minimal 2 data)');
  const big = await call('GET', `${R}?pageSize=1000`);
  c1.check(4, listOk && is(big, 400, 'VALIDATION_ERROR'), `pageSize=1000 harus 400 VALIDATION_ERROR (dapat ${got(big)})`);

  // 2. Detail
  const one = await call('GET', `${R}/${cfg.existingId}`);
  const oneOk = c2.check(4, is(one, 200) && one.json?.id === cfg.existingId,
    `GET ${R}/${cfg.existingId} harus 200 dengan id ${cfg.existingId} (dapat ${got(one)})`);
  const none = await call('GET', `${R}/999999999`);
  c2.check(4, oneOk && is(none, 404, 'NOT_FOUND'), `id 999999999 harus 404 NOT_FOUND (dapat ${got(none)})`);
  const bad = await call('GET', `${R}/abc`);
  c2.check(2, oneOk && is(bad, 400, 'VALIDATION_ERROR'), `id abc harus 400 VALIDATION_ERROR (dapat ${got(bad)})`);

  // 5. Filter (dijalankan sebelum ada data uji)
  const filtered = await call('GET', `${R}?${new URLSearchParams({ [cfg.filterParam]: cfg.filterValue })}`);
  const filterOk = c5.check(4,
    listOk && is(filtered, 200) && filtered.json?.total >= 1 && filtered.json.total < all,
    `filter ${cfg.filterParam}=${cfg.filterValue} harus 200 dengan total minimal 1 dan kurang dari ${all || 'total semua data'} (dapat ${got(filtered)}, total ${filtered.json?.total ?? '-'})`);
  const inject = await call('GET', `${R}?${new URLSearchParams({ [cfg.filterParam]: "' OR '1'='1" })}`);
  c5.check(6, filterOk && (is(inject, 400, 'VALIDATION_ERROR') || (is(inject, 200) && inject.json?.total === 0)),
    `filter berisi ' OR '1'='1 harus total 0 atau 400 (dapat ${got(inject)}, total ${inject.json?.total ?? '-'})`);

  // 3. Tambah data
  const body = fill(cfg.createBody);
  const made = await call('POST', R, body);
  const newId = made.json?.id;
  let mine = false;
  if (made.status === 201 && Number.isInteger(newId) && newId !== cfg.existingId) {
    const check = await call('GET', `${R}/${newId}`);
    mine = check.status === 200 && check.text.includes(unik);
    if (!mine) leftovers.push(newId);
  }
  c3.check(12, mine,
    `POST ${R} dengan createBody harus 201 { id, ... } dan GET ${R}/<id> memuat penanda unik (dapat ${got(made)}${made.json?.error ? `: ${made.json.error.message}` : ''})`);
  const invalid = await call('POST', R, fill(cfg.invalidBody));
  c3.check(8, is(invalid, 400, 'VALIDATION_ERROR') && invalid.json.error.details?.length > 0,
    `POST dengan invalidBody harus 400 VALIDATION_ERROR dengan details (dapat ${got(invalid)})`);
  if (invalid.status === 201) leftovers.push(invalid.json?.id);

  // 4. Data ganda
  if (mine) {
    const dup = await call('POST', R, body);
    c4.check(10, is(dup, 409, 'DUPLICATE'), `POST data yang sama harus 409 DUPLICATE tanpa teks ORA (dapat ${got(dup)})`);
    if (dup.status === 201) leftovers.push(dup.json?.id);
  } else {
    c4.check(10, false, 'belum bisa dicek: POST data baru belum berhasil');
  }

  // 6. Hapus, hanya baris buatan skrip ini
  if (mine) {
    const del = await call('DELETE', `${R}/${newId}`);
    const deleted = c6.check(6, is(del, 204), `DELETE ${R}/${newId} harus 204 (dapat ${got(del)})`);
    if (deleted) {
      const after = await call('GET', `${R}/${newId}`);
      const again = await call('DELETE', `${R}/${newId}`);
      c6.check(4, is(after, 404, 'NOT_FOUND') && is(again, 404, 'NOT_FOUND'),
        `setelah dihapus, GET dan DELETE harus 404 NOT_FOUND (dapat ${got(after)} dan ${got(again)})`);
    } else {
      leftovers.push(newId);
      c6.check(4, false, 'belum bisa dicek: DELETE belum berhasil');
    }
  } else {
    c6.check(10, false, 'belum bisa dicek: POST data baru belum berhasil');
  }
} catch (err) {
  console.log(`Pengecekan berhenti: ${err.cause?.code ?? err.message}. Periksa terminal server.`);
}

const total = report();
if (leftovers.length) {
  console.log(`\nData uji tertinggal di ${R} (id ${leftovers.join(', ')}, penanda ${unik}). Hapus manual.`);
}
process.exit(total === 80 ? 0 : 1);
