import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';

export const createAuthRouter = (authController) => {
  const router = Router();

  router.post('/register', authController.register);
  router.post('/login', authController.login);
  router.get('/me', authenticate, authController.getProfile);

  return router;
};
