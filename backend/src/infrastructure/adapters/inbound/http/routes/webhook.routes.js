import { Router } from 'express';

export const createWebhookRouter = (telegramWebhookController) => {
  const router = Router();

  // Endpoint pasivo HTTPS para Telegram
  router.post('/telegram', telegramWebhookController.handleWebhook);

  return router;
};
