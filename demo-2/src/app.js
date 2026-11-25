import { readFileSync } from 'node:fs';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import { poolStatus, query } from './db/oracle.js';
import { labRouter } from './lab/lab.routes.js';
import { errorHandler, notFoundRoute } from './middlewares/error-handler.js';
import { router } from './routes/index.js';

const openapi = YAML.parse(readFileSync(new URL('../openapi.yaml', import.meta.url), 'utf8'));

export const app = express();
app.use(express.json());

app.get('/health', async (req, res) => {
  const { rows } = await query(`SELECT 'up' AS db FROM dual`);
  res.json({ status: 'ok', db: rows[0].DB, pool: poolStatus() });
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));
app.use('/api/lab', labRouter); // endpoint Lab tim, di src/lab/
app.use('/api', router);

app.use(notFoundRoute);
app.use(errorHandler);
