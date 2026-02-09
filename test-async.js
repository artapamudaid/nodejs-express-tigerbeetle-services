import axios from 'axios';

const API_URL = 'http://localhost:3002/api/v1';
const TENANT_ID = '100';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function runTest() {
  try {
    console.log("1. Membuat Akun A & B...");
    // Buat Akun A (Debit)
    const accA = await axios.post(`${API_URL}/accounts`, 
      { name: "User A", external_id: "1001" },
      { headers: { 'x-tenant-id': TENANT_ID } }
    );
    const idA = accA.data.id;

    // Buat Akun B (Credit)
    const accB = await axios.post(`${API_URL}/accounts`, 
        { name: "User B", external_id: "2001" }, // <--- Ganti jadi Angka String
        { headers: { 'x-tenant-id': TENANT_ID } }
    );
    const idB = accB.data.id;
    console.log(`   ID A: ${idA}, ID B: ${idB}`);

    // Cek Saldo Awal B
    const initialRes = await axios.get(`${API_URL}/accounts/${idB}`, { headers: { 'x-tenant-id': TENANT_ID } });
    const initialBalance = BigInt(initialRes.data.balance);
    console.log(`   Saldo Awal B: ${initialBalance}`);

    console.log("2. Mengirim Transfer (Masuk Queue)...");
    const amount = 5000;
    await axios.post(`${API_URL}/transfers`, 
      { debit_account_id: idA, credit_account_id: idB, amount: amount },
      { headers: { 'x-tenant-id': TENANT_ID } }
    );

    console.log("3. Menunggu Worker memproses (Polling)...");
    
    let updatedBalance = initialBalance;
    let attempts = 0;
    const maxAttempts = 20; // Coba 20 kali (total 2 detik)

    while (attempts < maxAttempts) {
      await sleep(100); // Tunggu 100ms
      
      const checkRes = await axios.get(`${API_URL}/accounts/${idB}`, { headers: { 'x-tenant-id': TENANT_ID } });
      updatedBalance = BigInt(checkRes.data.balance);

      if (updatedBalance === initialBalance + BigInt(amount)) {
        console.log(`✅ SUKSES! Saldo terupdate: ${updatedBalance}`);
        return;
      }
      
      process.stdout.write("."); // Loading indicator
      attempts++;
    }

    console.error("\n❌ GAGAL: Saldo tidak berubah setelah 2 detik. Cek Worker/Redis!");

  } catch (err) {
    console.error("\n❌ ERROR:", err.response ? err.response.data : err.message);
  }
}

runTest();