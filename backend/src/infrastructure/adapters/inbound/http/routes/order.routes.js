import { Router } from 'express';
import { authenticate, authorizeRole } from '../middlewares/auth.middleware.js';

export const createOrderRouter = (orderController) => {
  const router = Router();

  router.use(authenticate);

  router.post('/', orderController.create);
  router.get('/', orderController.getAll);
  router.get('/:id', orderController.getById);
  router.patch('/:id/status', authorizeRole('admin'), orderController.updateStatus);
  router.delete('/:id', authorizeRole('admin'), orderController.delete);

  return router;
};

