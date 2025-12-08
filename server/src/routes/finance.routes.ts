import { Router } from 'express';
import { financeController } from '../controllers/finance.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { verifyPermission } from '../middleware/authMiddleware.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Client invoice routes (no permission check - clients can view their own)
router.get('/invoices/client', financeController.getClientInvoices);
router.get('/invoices/:id', financeController.getInvoiceById);

// All other routes require finance management permission
router.use(verifyPermission('can_manage_finance'));

// Invoice routes (admin)
router.get('/invoices', financeController.getAllInvoices);
router.post('/invoices', financeController.createInvoice);
router.put('/invoices/:id', financeController.updateInvoice);
router.delete('/invoices/:id', financeController.deleteInvoice);

// Transaction routes
router.get('/transactions', financeController.getAllTransactions);
router.post('/transactions', financeController.createTransaction);
router.get('/transactions/summary', financeController.getFinancialSummary);

// Budget routes
router.get('/budgets', financeController.getAllBudgets);
router.post('/budgets', financeController.createBudget);

// Expense Category routes
router.get('/categories', financeController.getAllCategories);
router.post('/categories', financeController.createCategory);

// Accounts Payable/Receivable routes
router.get('/payables', financeController.getAllPayables);
router.post('/payables', financeController.createPayable);
router.get('/receivables', financeController.getAllReceivables);
router.post('/receivables', financeController.createReceivable);

export default router;

