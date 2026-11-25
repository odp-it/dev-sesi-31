// Titik masuk: buka pool dulu, baru terima request. Tutup pool saat aplikasi dihentikan.
import { config } from './config.js';
import { closePool, initPool } from './db/oracle.js';
import { app } from './app.js';

await initPool();
const server = app.listen(config.port, async (err) => {
  if (err) {
    // Express 5 memanggil callback ini juga saat gagal listen (mis. port sudah dipakai).
    console.error(`Server gagal start di port ${config.port}: ${err.message}`);
    await closePool();
    process.exit(1);
  }
  console.log(`API Tabungan UMKM jalan di http://localhost:${config.port}`);
  console.log(`Swagger UI: http://localhost:${config.port}/docs`);
});

let closing = false;
async function shutdown(signal) {
  if (closing) return; // sinyal kedua (mis. dari --watch) diabaikan
  closing = true;
  console.log(`${signal} diterima, menutup server dan connection pool...`);
  server.close();
  await closePool();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
