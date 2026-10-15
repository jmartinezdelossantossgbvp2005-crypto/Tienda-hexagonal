import { Router } from 'express';
import { authenticate, authorizeRole } from '../middlewares/auth.middleware.js';
import { uploadImage } from '../middlewares/upload.middleware.js';

export const createProductRouter = (productController) => {
  const router = Router();

  router.get('/', productController.getAll);
  router.get('/:id', productController.getById);

  router.post('/', authenticate, authorizeRole('admin'), uploadImage.single('image'), productController.create);
  router.put('/:id', authenticate, authorizeRole('admin'), uploadImage.single('image'), productController.update);
  router.delete('/:id', authenticate, authorizeRole('admin'), productController.delete);

  return router;
};
