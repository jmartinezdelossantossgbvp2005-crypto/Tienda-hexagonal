import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from '../../../config/env.js';
import { pool } from '../../outbound/postgres/connection.js';

import { PostgresUserRepository } from '../../outbound/postgres/PostgresUserRepository.js';
import { PostgresProductRepository } from '../../outbound/postgres/PostgresProductRepository.js';
import { PostgresOrderRepository } from '../../outbound/postgres/PostgresOrderRepository.js';
import { BcryptJwtAdapter } from '../../outbound/security/BcryptJwtAdapter.js';
import { CloudinaryAdapter } from '../../outbound/storage/CloudinaryAdapter.js';
import { QueueNotificationAdapter } from '../../outbound/notifications/QueueNotificationAdapter.js';

import { EmailWorker } from '../../../workers/EmailWorker.js';
import { TelegramWorker } from '../../../workers/TelegramWorker.js';
import { initWeeklySummaryCron } from '../../../cron/weeklySummary.cron.js';

import { RegisterUser } from '../../../../application/use-cases/user/RegisterUser.js';
import { LoginUser } from '../../../../application/use-cases/user/LoginUser.js';
import { GetUsers } from '../../../../application/use-cases/user/GetUsers.js';
import { UpdateUser } from '../../../../application/use-cases/user/UpdateUser.js';
import { DeleteUser } from '../../../../application/use-cases/user/DeleteUser.js';

import { CreateProduct } from '../../../../application/use-cases/product/CreateProduct.js';
import { GetProducts } from '../../../../application/use-cases/product/GetProducts.js';
import { GetProductById } from '../../../../application/use-cases/product/GetProductById.js';
import { UpdateProduct } from '../../../../application/use-cases/product/UpdateProduct.js';
import { DeleteProduct } from '../../../../application/use-cases/product/DeleteProduct.js';

import { CreateOrder } from '../../../../application/use-cases/order/CreateOrder.js';
import { GetOrders } from '../../../../application/use-cases/order/GetOrders.js';
import { GetOrderById } from '../../../../application/use-cases/order/GetOrderById.js';
import { UpdateOrderStatus } from '../../../../application/use-cases/order/UpdateOrderStatus.js';
import { DeleteOrder } from '../../../../application/use-cases/order/DeleteOrder.js';
import { GenerateWeeklySummary } from '../../../../application/use-cases/notifications/GenerateWeeklySummary.js';

import { AuthController } from './controllers/AuthController.js';
import { UserController } from './controllers/UserController.js';
import { ProductController } from './controllers/ProductController.js';
import { OrderController } from './controllers/OrderController.js';
import { TelegramWebhookController } from './controllers/TelegramWebhookController.js';

import { createAuthRouter } from './routes/auth.routes.js';
import { createUserRouter } from './routes/user.routes.js';
import { createProductRouter } from './routes/product.routes.js';
import { createOrderRouter } from './routes/order.routes.js';
import { createWebhookRouter } from './routes/webhook.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';

let backgroundServicesStarted = false;

export const createApp = () => {
  const app = express();

  const corsOrigin = config.corsOrigin || '*';
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || corsOrigin === '*' || corsOrigin === '') {
        return callback(null, true);
      }
      const allowedList = corsOrigin.split(',').map(s => s.trim());
      if (allowedList.includes(origin) || allowedList.includes('*')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true
  }));
  app.use(express.json());
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

  // Adaptadores de infraestructura
  const userRepository = new PostgresUserRepository(pool);
  const productRepository = new PostgresProductRepository(pool);
  const orderRepository = new PostgresOrderRepository(pool);
  const securityService = new BcryptJwtAdapter();
  const storageService = new CloudinaryAdapter();
  const notificationService = new QueueNotificationAdapter();

  // Casos de uso de Usuarios
  const registerUserUseCase = new RegisterUser(userRepository, securityService);
  const loginUserUseCase = new LoginUser(userRepository, securityService);
  const getUsersUseCase = new GetUsers(userRepository);
  const updateUserUseCase = new UpdateUser(userRepository, securityService);
  const deleteUserUseCase = new DeleteUser(userRepository);

  // Casos de uso de Productos (inyectando StoragePort / Cloudinary)
  const createProductUseCase = new CreateProduct(productRepository, storageService);
  const getProductsUseCase = new GetProducts(productRepository);
  const getProductByIdUseCase = new GetProductById(productRepository);
  const updateProductUseCase = new UpdateProduct(productRepository, storageService);
  const deleteProductUseCase = new DeleteProduct(productRepository, storageService);

  // Casos de uso de Pedidos y Notificaciones (inyectando NotificationPort / BullMQ)
  const lowStockThreshold = config.notifications?.lowStockThreshold || 5;
  const createOrderUseCase = new CreateOrder(orderRepository, productRepository, userRepository, notificationService, lowStockThreshold);
  const getOrdersUseCase = new GetOrders(orderRepository);
  const getOrderByIdUseCase = new GetOrderById(orderRepository);
  const updateOrderStatusUseCase = new UpdateOrderStatus(orderRepository);
  const deleteOrderUseCase = new DeleteOrder(orderRepository);
  const generateWeeklySummaryUseCase = new GenerateWeeklySummary(orderRepository, productRepository, notificationService);

  // Inicializar Workers en segundo plano y Cronjob solo si está explícitamente habilitado en este proceso
  // En producción desacoplada, los workers corren en su propio contenedor (npm run start:workers)
  const runWorkersInHttp = process.env.RUN_BACKGROUND_WORKERS === 'true';
  if (!backgroundServicesStarted && runWorkersInHttp && config.nodeEnv !== 'test') {
    try {
      const emailWorker = new EmailWorker();
      emailWorker.start();

      const telegramWorker = new TelegramWorker();
      telegramWorker.start();

      initWeeklySummaryCron(generateWeeklySummaryUseCase);
      backgroundServicesStarted = true;
      console.log('🚀 Workers de BullMQ (Email y Telegram) y Cron semanal inicializados en el proceso HTTP.');
    } catch (err) {
      console.warn('⚠️ No se pudieron inicializar los Workers en segundo plano:', err.message);
    }
  }

  // Controladores HTTP
  const authController = new AuthController(registerUserUseCase, loginUserUseCase, userRepository);
  const userController = new UserController(getUsersUseCase, updateUserUseCase, deleteUserUseCase, userRepository);
  const productController = new ProductController(createProductUseCase, getProductsUseCase, getProductByIdUseCase, updateProductUseCase, deleteProductUseCase);
  const orderController = new OrderController(createOrderUseCase, getOrdersUseCase, getOrderByIdUseCase, updateOrderStatusUseCase, deleteOrderUseCase);
  const telegramWebhookController = new TelegramWebhookController(productRepository, generateWeeklySummaryUseCase);

  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'Tienda Hexagonal API',
      timestamp: new Date().toISOString()
    });
  });

  app.use('/api/auth', createAuthRouter(authController));
  app.use('/api/users', createUserRouter(userController));
  app.use('/api/products', createProductRouter(productController));
  app.use('/api/orders', createOrderRouter(orderController));
  app.use('/api/webhooks', createWebhookRouter(telegramWebhookController));

  app.use(errorHandler);

  return app;
};
