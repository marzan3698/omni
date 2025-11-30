import { Router } from 'express';
import { companyController } from '../controllers/company.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { verifyPermission } from '../middleware/authMiddleware.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Company routes
router.get('/', verifyPermission('can_manage_companies'), companyController.getAllCompanies);
router.get('/search', verifyPermission('can_manage_companies'), companyController.searchCompanies);
router.get('/:id', verifyPermission('can_manage_companies'), companyController.getCompanyById);
router.post('/', verifyPermission('can_manage_companies'), companyController.createCompany);
router.put('/:id', verifyPermission('can_manage_companies'), companyController.updateCompany);
router.delete('/:id', verifyPermission('can_manage_companies'), companyController.deleteCompany);

// Company contacts
router.get('/:id/contacts', verifyPermission('can_manage_companies'), companyController.getCompanyContacts);
router.post('/:id/contacts', verifyPermission('can_manage_companies'), companyController.addCompanyContact);

// Company contracts
router.get('/:id/contracts', verifyPermission('can_manage_companies'), companyController.getCompanyContracts);
router.post('/:id/contracts', verifyPermission('can_manage_companies'), companyController.createCompanyContract);
router.put('/contracts/:id', verifyPermission('can_manage_companies'), companyController.updateContract);

export default router;

