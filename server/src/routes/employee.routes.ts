import { Router } from 'express';
import { employeeController } from '../controllers/employee.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { verifyPermission, verifyPermissionAny } from '../middleware/authMiddleware.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Current user balance/points - no permission required, any authenticated user can see their own
router.get('/me/balance-points', employeeController.getMyBalancePoints);

// Employee list/detail: allow can_manage_leads (e.g. Lead Manager) so they can load employees for lead assignment
router.get('/', verifyPermissionAny(['can_manage_employees', 'can_manage_leads']), employeeController.getAllEmployees);
router.get('/:id', verifyPermissionAny(['can_manage_employees', 'can_manage_leads']), employeeController.getEmployeeById);
router.post('/', verifyPermission('can_manage_employees'), employeeController.createEmployee);
router.put('/:id', verifyPermission('can_manage_employees'), employeeController.updateEmployee);
router.delete('/:id', verifyPermission('can_manage_employees'), employeeController.deleteEmployee);
router.get('/:id/tasks', verifyPermission('can_manage_employees'), employeeController.getEmployeeTasks);
router.get('/:id/performance', verifyPermission('can_manage_employees'), employeeController.getEmployeePerformance);

export default router;

