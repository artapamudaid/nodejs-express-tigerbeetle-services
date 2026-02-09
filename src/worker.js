// src/worker.js
import { createClient } from 'tigerbeetle-node';
import { dequeueBatch } from './utils/queue.js';
import { applyBigIntPatch } from './utils/serialization.js';
import dotenv from 'dotenv';

dotenv.config();
applyBigIntPatch();

// Setup Client
const client = createClient({
  cluster_id: BigInt(process.env.TB_CLUSTER_ID || 0),
  replica_addresses: [process.env.TB_REPLICA_ADDRESSES || '3001'],
});

const BATCH_SIZE = 100;
const POLLING_INTERVAL = 50; // ms

async function runWorker() {
  console.log("WORKER STARTED");

  while (true) {
    try {
      const batch = await dequeueBatch(BATCH_SIZE);

      if (batch && batch.length > 0) {
        console.log(`Get batch: ${batch.length} item.`);
        
        // --- PERBAIKAN DISINI ---
        // Pastikan SEMUA key menggunakan snake_case dan dikonversi ke BigInt
        const tbTransfers = batch.map(t => {
          return {
            id: BigInt(t.id),
            debit_account_id: BigInt(t.debit_account_id),
            credit_account_id: BigInt(t.credit_account_id),
            amount: BigInt(t.amount),
            
            // Perhatikan nama key ini (snake_case):
            user_data_128: BigInt(t.user_data_128 || 0),
            user_data_64: BigInt(t.user_data_64 || 0),
            user_data_32: Number(t.user_data_32 || 0),
            
            pending_id: BigInt(t.pending_id || 0), // <--- INI YG BIKIN ERROR TADI
            
            timeout: Number(t.timeout || 0),
            ledger: Number(t.ledger), // Pastikan Number (Integer)
            code: Number(t.code || 1),
            flags: Number(t.flags || 0),
            timestamp: 0n, // Timestamp diisi otomatis oleh TB
          };
        });

        // Debug: Intip data sebelum dikirim (Optional)
        // console.log("Data to TB:", tbTransfers[0]);

        // console.log(`🚀 Mengirim ke TigerBeetle...`);
        const errors = await client.createTransfers(tbTransfers);

        if (errors.length > 0) {
          console.error("REJECTED:", errors);
          // Error handling logic here...
        } else {
        //   console.log(`✅ SUKSES! ${batch.length} Transaksi berhasil diposting.`);
        process.stdout.write("OK!");
        }
      } 
      
      else {
        await new Promise(r => setTimeout(r, POLLING_INTERVAL));
      }

    } catch (err) {
      console.error("Error:", err);
      // Jangan exit process, tunggu saja lalu retry
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

runWorker();