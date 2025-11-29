import { Router } from 'express';
import { exampleController } from '../controllers/example.controller.js';

const router = Router();

// Example route - remove this when implementing real routes
router.get('/', exampleController.getExample);

export default router;

