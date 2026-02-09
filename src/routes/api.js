import express from 'express';
import * as ledgerController from '../controllers/ledgerController.js';

const router = express.Router();

// Routes
router.post('/accounts', ledgerController.createAccount);
router.post('/transfers', ledgerController.createTransfer);
router.get('/accounts/:id', ledgerController.getBalance);

export default router;