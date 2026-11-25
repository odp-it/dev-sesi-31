// Transfer antar rekening: debit + kredit + dua baris mutasi dalam SATU transaksi database.
import { withTransaction } from '../db/oracle.js';
import { AppError, notFound } from '../utils/app-error.js';
import { toMoney } from '../utils/format.js';

const INSERT_TXN = `
  INSERT INTO transactions (account_id, txn_type, category, amount, txn_at, description, ref_no)
  VALUES (:accountId, :txnType, 'TRANSFER', :amount, TO_TIMESTAMP(:txnAt, 'YYYY-MM-DD"T"HH24:MI:SS'), :description, :refNo)`;

// TODO 3.2: isi fungsi ini mengikuti langkah di README (3.2).
//   Semua statement memakai conn dari withTransaction, BUKAN query().
// eslint-disable-next-line no-unused-vars
export async function transfer({ fromAccountId, toAccountId, amount, description }) {
  throw new AppError(501, 'NOT_IMPLEMENTED', `TODO 3.2 belum dikerjakan`);
}
