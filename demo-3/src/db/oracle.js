// Satu connection pool untuk seluruh aplikasi.
import oracledb from 'oracledb';
import { config } from '../config.js';

// Baris hasil query berupa object { KOLOM: nilai }.
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
// NUMBER diambil sebagai string supaya uang NUMBER(15,2) tidak berubah jadi float JavaScript.
oracledb.fetchAsString = [oracledb.NUMBER];

let pool;

export async function initPool() {
  pool = await oracledb.createPool({
    user: config.db.user,
    password: config.db.password,
    connectString: config.db.connectString,
    poolMin: config.db.poolMin,
    poolMax: config.db.poolMax,
    poolIncrement: 1,
  });
  // Thin mode membuat pool tanpa langsung login: pinjam satu koneksi supaya salah konfigurasi ketahuan saat start.
  const conn = await pool.getConnection();
  await conn.close();
  return pool;
}

export async function closePool() {
  if (pool) await pool.close(10);
}

export function poolStatus() {
  return { open: pool.connectionsOpen, inUse: pool.connectionsInUse, max: pool.poolMax };
}

// Satu statement, pinjam koneksi lalu kembalikan ke pool.
export async function query(sql, binds = {}, options = {}) {
  let conn;
  try {
    conn = await pool.getConnection();
    return await conn.execute(sql, binds, options);
  } finally {
    if (conn) await conn.close();
  }
}

// TODO 3.1: beberapa statement dalam satu transaksi.
//   pinjam koneksi -> jalankan work(conn) -> commit kalau berhasil, rollback kalau error (lempar ulang)
//   -> koneksi selalu dikembalikan di finally.
// eslint-disable-next-line no-unused-vars
export async function withTransaction(work) {
  throw new Error('TODO 3.1 belum dikerjakan');
}
