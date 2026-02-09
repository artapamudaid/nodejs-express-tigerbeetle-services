import axios from 'axios';

const API_URL = 'http://localhost:3002/api/v1';
const TENANT_ID = '500'; // Kita pakai Tenant ID baru biar bersih

// Kode Akun Akuntansi (String)
const COA_KAS = "1-1100.01";      // Kas Besar
const COA_PENDAPATAN = "4-1000";  // Pendapatan Jasa

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function runTest() {
  try {
    console.log(`\n🧪 TEST SCENARIO: Jurnal Akuntansi dengan Kode CoA String`);
    console.log(`   Tenant: ${TENANT_ID}`);
    console.log(`   Akun Debit: ${COA_KAS}`);
    console.log(`   Akun Kredit: ${COA_PENDAPATAN}`);
    console.log("---------------------------------------------------");

    // 1. Buat Akun KAS (Asset)
    console.log("1️⃣  Membuat Akun KAS...");
    const resKas = await axios.post(`${API_URL}/accounts`, 
      { name: "Kas Besar", external_id: COA_KAS }, // Kirim String "1-1100.01"
      { headers: { 'x-tenant-id': TENANT_ID } }
    );
    const idKas = resKas.data.id;
    console.log(`    ✅ Sukses! TB_ID: ${idKas} (Mapped from ${COA_KAS})`);

    // 2. Buat Akun PENDAPATAN (Revenue)
    console.log("2️⃣  Membuat Akun PENDAPATAN...");
    const resRev = await axios.post(`${API_URL}/accounts`, 
      { name: "Pendapatan Jasa", external_id: COA_PENDAPATAN }, // Kirim String "4-1000"
      { headers: { 'x-tenant-id': TENANT_ID } }
    );
    const idRev = resRev.data.id;
    console.log(`    ✅ Sukses! TB_ID: ${idRev} (Mapped from ${COA_PENDAPATAN})`);

    // 3. Posting Jurnal (Transfer)
    console.log("3️⃣  Posting Jurnal: Debit Kas, Kredit Pendapatan (Rp 1.500.000)...");
    const amount = 1500000;
    
    await axios.post(`${API_URL}/transfers`, 
      { 
        debit_account_id: idKas, 
        credit_account_id: idRev, 
        amount: amount 
      },
      { headers: { 'x-tenant-id': TENANT_ID } }
    );
    console.log("    ✅ Request terkirim ke Queue.");

    // 4. Cek Saldo (Polling)
    console.log("4️⃣  Menunggu Worker & Cek Saldo Kas...");
    
    let attempts = 0;
    while (attempts < 20) {
      await sleep(100);
      
      const checkRes = await axios.get(`${API_URL}/accounts/${idKas}`, { 
        headers: { 'x-tenant-id': TENANT_ID } 
      });
      
      // Saldo Kas (Debit) harus positif, Saldo Pendapatan (Kredit) harus negatif (di TB Balance)
      // Tapi TB menyimpan credits_posted & debits_posted terpisah.
      // Net Balance = credits - debits (Liabilitas/Equity) atau debits - credits (Asset).
      
      // Mari kita cek detailnya:
      const debits = BigInt(checkRes.data.details.debits_posted);
      
      if (debits === BigInt(amount)) {
        console.log(`\n🎉 INTEGRASI SUKSES!`);
        console.log(`   Akun Kas (${COA_KAS}) bertambah debit sebesar: Rp ${debits}`);
        return;
      }
      
      process.stdout.write(".");
      attempts++;
    }

    console.error("\n❌ Timeout: Saldo tidak berubah.");

  } catch (err) {
    console.error("\n❌ ERROR:", err.response ? err.response.data : err.message);
  }
}

runTest();