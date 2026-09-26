import { Router } from 'express';
import { authenticate, authorizeRole } from '../middlewares/auth.middleware.js';

export const createUserRouter = (userController) => {
  const router = Router();

  router.use(authenticate);

  router.get('/', authorizeRole('admin'), userController.getAll);
  router.get('/:id', userController.getById);
  router.put('/:id', userController.update);
  router.delete('/:id', authorizeRole('admin'), userController.delete);

  return router;
};
