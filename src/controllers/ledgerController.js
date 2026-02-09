import * as ledgerService from '../services/ledgerService.js';

export const createAccount = async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'];
    const { name, external_id } = req.body;

    if (!tenantId) return res.status(400).json({ error: 'Missing x-tenant-id header' });

    const result = await ledgerService.createAccount(tenantId, name, external_id);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createTransfer = async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'];

    const { debit_account_id, credit_account_id, amount } = req.body;

    if (!tenantId) return res.status(400).json({ error: 'Missing x-tenant-id header' });
    
    // Validasi Manual agar errornya jelas
    if (!debit_account_id) throw new Error("Field 'debit_account_id' hilang/undefined");
    if (!credit_account_id) throw new Error("Field 'credit_account_id' hilang/undefined");
    if (!amount) throw new Error("Field 'amount' hilang/undefined");

    const result = await ledgerService.createTransfer(tenantId, debit_account_id, credit_account_id, amount);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ 
      error: "Transfer Failed", 
      message: error.message 
    });
  }
};

export const getBalance = async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'];
    const { id } = req.params;

    if (!tenantId) return res.status(400).json({ error: 'Missing x-tenant-id' });

    const result = await ledgerService.getAccountBalance(tenantId, id);
    
    if (!result) return res.status(404).json({ error: 'Account not found' });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};