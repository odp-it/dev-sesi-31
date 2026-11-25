// Akses tabel ACCOUNTS dan TRANSACTIONS (mutasi) dengan SQL langsung.
import { query } from '../db/oracle.js';
import { AppError } from '../utils/app-error.js';
import { isoWib, toMoney } from '../utils/format.js';

const SELECT_ACCOUNT = `
  SELECT account_id, account_no, customer_id, product, balance, status, ${isoWib('opened_at')} AS opened_at
    FROM accounts`;

const toAccount = (r) => ({
  id: Number(r.ACCOUNT_ID),
  accountNo: r.ACCOUNT_NO,
  customerId: Number(r.CUSTOMER_ID),
  product: r.PRODUCT,
  balance: toMoney(r.BALANCE),
  status: r.STATUS,
  openedAt: r.OPENED_AT,
});

const toTransaction = (r) => ({
  id: Number(r.TXN_ID),
  refNo: r.REF_NO,
  accountId: Number(r.ACCOUNT_ID),
  txnType: r.TXN_TYPE,
  category: r.CATEGORY,
  amount: toMoney(r.AMOUNT),
  txnAt: r.TXN_AT,
  description: r.DESCRIPTION,
});

export async function findByCustomer(customerId) {
  const result = await query(`${SELECT_ACCOUNT} WHERE customer_id = :customerId ORDER BY account_id`, { customerId });
  return result.rows.map(toAccount);
}

export async function findById(id) {
  const result = await query(`${SELECT_ACCOUNT} WHERE account_id = :id`, { id });
  return result.rows[0] ? toAccount(result.rows[0]) : null;
}

// TODO 2.1: mutasi rekening dengan filter opsional dan pagination.
//   WHERE t.account_id = :accountId
//     + from     -> t.txn_at >= TO_DATE(:fromDate, 'YYYY-MM-DD')
//     + to       -> t.txn_at < TO_DATE(:toDate, 'YYYY-MM-DD') + 1
//     + category -> t.category = :category
//   COUNT(*) untuk total, lalu SELECT kolom mutasi (txn_at diformat dengan isoWib)
//   ORDER BY t.txn_at, t.txn_id + OFFSET/FETCH. return { rows: [...toTransaction], total }
// eslint-disable-next-line no-unused-vars
export async function findTransactions(accountId, { from, to, category, page, pageSize }) {
  throw new AppError(501, 'NOT_IMPLEMENTED', `TODO 2.1 belum dikerjakan`);
}
