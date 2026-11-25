// Lab · endpoint untuk aplikasi ALP tim. Semua path di file ini diawali /api/lab (lihat src/app.js).
// Pola yang sama dengan routes + controller: validate(...) dulu, lalu panggil repository, lalu kirim respons.
//
// TODO Lab 1: GET    /<resource>       daftar { data, page, pageSize, total } + satu filter teks
// TODO Lab 2: GET    /<resource>/:id   detail, 404 NOT_FOUND kalau tidak ada (pakai notFound() dari utils/app-error.js)
// TODO Lab 3: POST   /<resource>       201 + header Location + data baru (minimal field id)
// TODO Lab 4: DELETE /<resource>/:id   204, 404 kalau tidak ada
import { Router } from 'express';

export const labRouter = Router();
