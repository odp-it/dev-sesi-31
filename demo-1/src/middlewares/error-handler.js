// Error handler terpusat: semua error jadi format { error: { code, message, details } }.
import { AppError } from '../utils/app-error.js';

// Nama constraint Oracle -> field di kontrak API.
const UNIQUE_FIELDS = {
  UQ_CUSTOMERS_CIF: 'cifNo',
  UQ_CUSTOMERS_EMAIL: 'email',
  UQ_ACCOUNTS_NO: 'accountNo',
  UQ_TRANSACTIONS_REF: 'refNo',
};

const FK_FIELDS = {
  FK_CUSTOMERS_BRANCH: 'branchId',
  FK_ACCOUNTS_CUSTOMER: 'customerId',
  FK_TRANSACTIONS_ACCOUNT: 'accountId',
};

// "ORA-00001: unique constraint (ALP_DEV.UQ_CUSTOMERS_EMAIL) violated ..." -> "UQ_CUSTOMERS_EMAIL"
const constraintOf = (message) => message.match(/\(\w+\.(\w+)\)/)?.[1];

function fromOracle(err) {
  switch (err.errorNum) {
    // TODO 1.8: ORA-00001 (errorNum 1)    -> 409 DUPLICATE, details [{ field, issue: 'duplicate', message }] dari UNIQUE_FIELDS
    // TODO 1.8: ORA-02292 (errorNum 2292) -> 409 CUSTOMER_HAS_ACCOUNTS kalau constraint FK_ACCOUNTS_CUSTOMER,
    //                                       selain itu 409 HAS_RELATED_DATA
    case 2291: {
      const field = FK_FIELDS[constraintOf(err.message)];
      const message = `${field ?? 'Data referensi'} tidak ditemukan`;
      return new AppError(400, 'VALIDATION_ERROR', message, field ? [{ field, issue: 'not_found', message }] : undefined);
    }
    default:
      return null;
  }
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let appError = err instanceof AppError ? err : null;
  if (!appError && err.type === 'entity.parse.failed') {
    appError = new AppError(400, 'VALIDATION_ERROR', 'Body bukan JSON yang valid');
  }
  if (!appError && err.errorNum) appError = fromOracle(err);

  if (!appError) {
    console.error(err);
    appError = new AppError(500, 'INTERNAL_ERROR', 'Terjadi kesalahan di server');
  }
  const body = { error: { code: appError.code, message: appError.message } };
  if (appError.details) body.error.details = appError.details;
  res.status(appError.status).json(body);
}

export function notFoundRoute(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `Endpoint ${req.method} ${req.path} tidak ada` } });
}
