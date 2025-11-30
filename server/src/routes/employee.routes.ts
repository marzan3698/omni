import { Router } from 'express';
import { employeeController } from '../controllers/employee.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { verifyPermission } from '../middleware/authMiddleware.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Employee routes
router.get('/', verifyPermission('can_manage_employees'), employeeController.getAllEmployees);
router.get('/:id', verifyPermission('can_manage_employees'), employeeController.getEmployeeById);
router.post('/', verifyPermission('can_manage_employees'), employeeController.createEmployee);
router.put('/:id', verifyPermission('can_manage_employees'), employeeController.updateEmployee);
router.delete('/:id', verifyPermission('can_manage_employees'), employeeController.deleteEmployee);
router.get('/:id/tasks', verifyPermission('can_manage_employees'), employeeController.getEmployeeTasks);
router.get('/:id/performance', verifyPermission('can_manage_employees'), employeeController.getEmployeePerformance);

export default router;

