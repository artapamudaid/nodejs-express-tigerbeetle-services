import { enqueueTransfer } from '../utils/queue.js';
import { generateTbId } from '../utils/id.js'; // Pastikan path ini benar
// import client from '../config/tigerbeetle.js'; // Tidak dipakai jika pakai Redis

// Helper: Mengubah String apapun menjadi BigInt (Hash sederhana)
// Berguna jika ID Anda ada hurufnya
function stringToBigInt(str) {
  if (!str) return 0n;
  if (/^\d+$/.test(str)) return BigInt(str);
  let hash = 5381n;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5n) + hash) + BigInt(str.charCodeAt(i)); 
  }
  return hash;
}

// Service: Create Account
export const createAccount = async (tenantId, name, externalId) => {
  // Kita import client DISINI SAJA (Lazy load) atau di atas jika tidak error
  const client = (await import('../config/tigerbeetle.js')).default;
  
  const accountId = generateTbId();
  
  const account = {
    id: accountId,
    debits_pending: 0n,
    debits_posted: 0n,
    credits_pending: 0n,
    credits_posted: 0n,
    user_data_128: stringToBigInt(externalId),
    user_data_64: 0n,
    user_data_32: 0,
    reserved: 0,
    ledger: parseInt(tenantId),
    code: 1,
    flags: 0,
    timestamp: 0n,
  };

  const errors = await client.createAccounts([account]);
  
  if (errors.length > 0) {
    throw new Error(`TigerBeetle Error: ${errors[0].result}`);
  }

  return { id: accountId, name, ledger: account.ledger };
};

// Service: Create Transfer (FIXED)
export const createTransfer = async (tenantId, debitId, creditId, amount) => {
  const transferId = generateTbId();

  // --- PERHATIKAN NAMA VARIABEL INI ---
  const transferData = { 
    id: transferId,
    debit_account_id: BigInt(debitId),
    credit_account_id: BigInt(creditId),
    amount: BigInt(amount),
    ledger: parseInt(tenantId),
    code: 1,
    flags: 0,
    timestamp: 0n,
    pending_id: 0n,
    user_data_128: 0n,
    user_data_64: 0n,
    user_data_32: 0,
    timeout: 0,
  };

  // --- HARUS SAMA DENGAN DISINI ---
  await enqueueTransfer(transferData); 
  
  return { id: transferId, status: 'queued' };
};

// Service: Get Balance
export const getAccountBalance = async (tenantId, accountId) => {
  const client = (await import('../config/tigerbeetle.js')).default;
  const accounts = await client.lookupAccounts([BigInt(accountId)]);
  
  if (accounts.length === 0) return null;

  const acc = accounts[0];

  // Security check tenant
  if (acc.ledger !== parseInt(tenantId)) {
    return null; 
  }

  return {
    id: acc.id.toString(),
    ledger: acc.ledger,
    balance: (acc.credits_posted - acc.debits_posted).toString(),
    details: acc
  };
};