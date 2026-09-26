import { Router } from 'express';
import { authenticate, authorizeRole } from '../middlewares/auth.middleware.js';

export const createProductRouter = (productController) => {
  const router = Router();

  router.get('/', productController.getAll);
  router.get('/:id', productController.getById);

  router.post('/', authenticate, authorizeRole('admin'), productController.create);
  router.put('/:id', authenticate, authorizeRole('admin'), productController.update);
  router.delete('/:id', authenticate, authorizeRole('admin'), productController.delete);

  return router;
};
