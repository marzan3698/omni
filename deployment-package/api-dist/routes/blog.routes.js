import { Router } from 'express';
import { blogController } from '../controllers/blog.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
const router = Router();
// Public
router.get('/posts/public', blogController.getPublic);
router.get('/posts/:slug', blogController.getBySlug);
// Authenticated management
router.get('/posts', authMiddleware, blogController.list);
router.post('/posts', authMiddleware, blogController.create);
router.put('/posts/:id', authMiddleware, blogController.update);
router.delete('/posts/:id', authMiddleware, blogController.remove);
export default router;
//# sourceMappingURL=blog.routes.js.map