import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';
import { applyBigIntPatch } from './utils/serialization.js';

applyBigIntPatch(); // Patch JSON agar support BigInt

// 1. Init Config & Utils
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// 2. Middlewares
app.use(helmet()); // Security headers
app.use(cors()); // Allow Cross Origin
app.use(morgan('dev')); // Logging
app.use(express.json()); // Body Parser

// 3. Routes
app.use('/api/v1', apiRoutes);

// 4. Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!', details: err.message });
});

// 5. Start Server
app.listen(PORT, () => {
  console.log(`Ledger Service running on http://localhost:${PORT}`);
  console.log(`Connected to TigerBeetle at port ${process.env.TB_REPLICA_ADDRESSES}`);
});