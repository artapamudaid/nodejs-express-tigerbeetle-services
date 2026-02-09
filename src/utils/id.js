import { v4 as uuidv4 } from 'uuid';

// Helper untuk membuat 128-bit ID yang kompatibel dengan TigerBeetle
export const generateTbId = () => {
  const buffer = Buffer.alloc(16);
  uuidv4(null, buffer);
  // Menggabungkan 2 buah 64-bit integer menjadi satu 128-bit BigInt
  return buffer.readBigUInt64BE(0) + (buffer.readBigUInt64BE(8) << 64n);
};