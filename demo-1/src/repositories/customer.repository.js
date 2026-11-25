// Akses tabel CUSTOMERS dengan SQL langsung. Semua nilai dari pemakai lewat bind variable.
// Bentuk hasil mengikuti kontrak sesi 29: daftar = CustomerSummary, detail = CustomerDetail.
import oracledb from 'oracledb';
import { query } from '../db/oracle.js';
import { AppError } from '../utils/app-error.js';
import { isoWib } from '../utils/format.js';

const SELECT_CUSTOMER = `
  SELECT c.customer_id, c.cif_no, c.full_name, c.email, c.phone, c.segment,
         c.branch_id, b.branch_code, ${isoWib('c.created_at')} AS created_at
    FROM customers c
    JOIN branches b ON b.branch_id = c.branch_id`;

const toSummary = (r) => ({
  id: Number(r.CUSTOMER_ID),
  cifNo: r.CIF_NO,
  fullName: r.FULL_NAME,
  segment: r.SEGMENT,
  branchCode: r.BRANCH_CODE,
});

const toDetail = (r) => ({
  id: Number(r.CUSTOMER_ID),
  cifNo: r.CIF_NO,
  fullName: r.FULL_NAME,
  email: r.EMAIL,
  phone: r.PHONE,
  segment: r.SEGMENT,
  branchId: Number(r.BRANCH_ID),
  branchCode: r.BRANCH_CODE,
  createdAt: r.CREATED_AT,
  accountCount: Number(r.ACCOUNT_COUNT),
});

// Filter opsional q (nama atau CIF) dan segment -> potongan WHERE + binds.
function buildFilter({ q, segment }) {
  const where = [];
  const binds = {};
  if (q) {
    where.push(`(UPPER(c.full_name) LIKE '%' || UPPER(:q) || '%' OR c.cif_no LIKE '%' || UPPER(:q) || '%')`);
    binds.q = q;
  }
  if (segment) {
    where.push('c.segment = :segment');
    binds.segment = segment;
  }
  return { whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '', binds };
}

// TODO 1.5: daftar nasabah dengan pagination.
//   1. COUNT(*) dengan filter yang sama -> total
//   2. SELECT_CUSTOMER + filter + ORDER BY c.customer_id + OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
//   return { rows: [...toSummary], total: Number(...) }
// eslint-disable-next-line no-unused-vars
export async function findMany({ page, pageSize, q, segment }) {
  throw new AppError(501, 'NOT_IMPLEMENTED', `TODO 1.5 belum dikerjakan`);
}

export async function findById(id) {
  const result = await query(
    `SELECT x.*, (SELECT COUNT(*) FROM accounts a WHERE a.customer_id = x.customer_id) AS account_count
       FROM (${SELECT_CUSTOMER} WHERE c.customer_id = :id) x`,
    { id },
  );
  return result.rows[0] ? toDetail(result.rows[0]) : null;
}

// TODO 1.6: blok PL/SQL INSERT ... RETURNING customer_id INTO v_id, lalu UPDATE cif_no = 'CIF-SIM-' || LPAD(v_id, 4, '0').
//   bind :id = { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }, opsi { autoCommit: true }
//   return result.outBinds.id
// eslint-disable-next-line no-unused-vars
export async function create(data) {
  throw new AppError(501, 'NOT_IMPLEMENTED', `TODO 1.6 belum dikerjakan`);
}

// TODO 1.7: UPDATE full_name, email, phone, segment, branch_id WHERE customer_id = :id (autoCommit)
//   return result.rowsAffected
// eslint-disable-next-line no-unused-vars
export async function update(id, data) {
  throw new AppError(501, 'NOT_IMPLEMENTED', `TODO 1.7 belum dikerjakan`);
}

// TODO 1.7: DELETE WHERE customer_id = :id (autoCommit), return result.rowsAffected
// eslint-disable-next-line no-unused-vars
export async function remove(id) {
  throw new AppError(501, 'NOT_IMPLEMENTED', `TODO 1.7 belum dikerjakan`);
}
