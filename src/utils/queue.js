import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Koneksi ke Redis
const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
};

// Tambah password jika ada
if (process.env.REDIS_PASSWORD) {
  redisConfig.password = process.env.REDIS_PASSWORD;
}

const redis = new Redis(redisConfig);

const QUEUE_KEY = 'ledger_transactions';

// 1. Producer: Masukkan data ke antrian Redis
export const enqueueTransfer = async (transferData) => {
  // Simpan sebagai string JSON
  await redis.rpush(QUEUE_KEY, JSON.stringify(transferData));
};

// 2. Consumer: Ambil banyak data sekaligus (Batching)
export const dequeueBatch = async (batchSize = 1000) => {
  // Pipeline agar atomik dan cepat
  const pipeline = redis.pipeline();
  
  // Ambil N item dari depan antrian
  pipeline.lrange(QUEUE_KEY, 0, batchSize - 1);
  // Hapus item yang sudah diambil (Trim)
  pipeline.ltrim(QUEUE_KEY, batchSize, -1);

  const results = await pipeline.exec();
  
  // results[0][1] adalah hasil LRANGE (Array of JSON strings)
  const rawItems = results[0][1]; 
  
  if (!rawItems || rawItems.length === 0) return [];

  // Parse kembali ke Object
  return rawItems.map(item => JSON.parse(item));
};

export default redis;