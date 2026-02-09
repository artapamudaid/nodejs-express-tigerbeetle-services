// test-connect.js
const { createClient } = require('tigerbeetle-node');

// Konfigurasi Client
const client = createClient({
  cluster_id: 0n, // Sesuai flag --cluster=0 saat format
  replica_addresses: ['3001'] // PENTING: Kita tadi pakai port 3001
});

async function main() {
  console.log("Menghubungkan ke TigerBeetle di port 3001...");

  try {
    // Kita coba buat 1 akun dummy untuk tes koneksi
    const account = {
      id: 12345n, // ID akun (BigInt)
      debits_pending: 0n,
      debits_posted: 0n,
      credits_pending: 0n,
      credits_posted: 0n,
      user_data_128: 0n,
      user_data_64: 0n,
      user_data_32: 0,
      reserved: 0,
      ledger: 1, // Ledger 1
      code: 1,
      flags: 0,
      timestamp: 0n,
    };

    const errors = await client.createAccounts([account]);

    if (errors.length > 0) {
      console.error("Gagal membuat akun:", errors);
    } else {
      console.log("✅ SUKSES! Koneksi berhasil dan Akun terbuat.");
      
      // Cek saldo akun yang baru dibuat
      const accounts = await client.lookupAccounts([12345n]);
      console.log("Data Akun dari DB:", accounts[0]);
    }
  } catch (e) {
    console.error("❌ ERROR KONEKSI:", e);
  } finally {
    process.exit(0);
  }
}

main();