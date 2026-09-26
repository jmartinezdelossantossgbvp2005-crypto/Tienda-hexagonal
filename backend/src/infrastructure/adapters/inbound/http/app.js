import express from 'express';
import cors from 'cors';
import { config } from '../../../config/env.js';
import { pool } from '../../outbound/postgres/connection.js';

import { PostgresUserRepository } from '../../outbound/postgres/PostgresUserRepository.js';
import { PostgresProductRepository } from '../../outbound/postgres/PostgresProductRepository.js';
import { PostgresOrderRepository } from '../../outbound/postgres/PostgresOrderRepository.js';
import { BcryptJwtAdapter } from '../../outbound/security/BcryptJwtAdapter.js';

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

import { AuthController } from './controllers/AuthController.js';
import { UserController } from './controllers/UserController.js';
import { ProductController } from './controllers/ProductController.js';
import { OrderController } from './controllers/OrderController.js';

import { createAuthRouter } from './routes/auth.routes.js';
import { createUserRouter } from './routes/user.routes.js';
import { createProductRouter } from './routes/product.routes.js';
import { createOrderRouter } from './routes/order.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';

export const createApp = () => {
  const app = express();

  app.use(cors({
    origin: config.corsOrigin,
    credentials: true
  }));
  app.use(express.json());

  const userRepository = new PostgresUserRepository(pool);
  const productRepository = new PostgresProductRepository(pool);
  const orderRepository = new PostgresOrderRepository(pool);
  const securityService = new BcryptJwtAdapter();

  const registerUserUseCase = new RegisterUser(userRepository, securityService);
  const loginUserUseCase = new LoginUser(userRepository, securityService);
  const getUsersUseCase = new GetUsers(userRepository);
  const updateUserUseCase = new UpdateUser(userRepository, securityService);
  const deleteUserUseCase = new DeleteUser(userRepository);

  const createProductUseCase = new CreateProduct(productRepository);
  const getProductsUseCase = new GetProducts(productRepository);
  const getProductByIdUseCase = new GetProductById(productRepository);
  const updateProductUseCase = new UpdateProduct(productRepository);
  const deleteProductUseCase = new DeleteProduct(productRepository);

  const createOrderUseCase = new CreateOrder(orderRepository, productRepository, userRepository);
  const getOrdersUseCase = new GetOrders(orderRepository);
  const getOrderByIdUseCase = new GetOrderById(orderRepository);
  const updateOrderStatusUseCase = new UpdateOrderStatus(orderRepository);
  const deleteOrderUseCase = new DeleteOrder(orderRepository);

  const authController = new AuthController(registerUserUseCase, loginUserUseCase, userRepository);
  const userController = new UserController(getUsersUseCase, updateUserUseCase, deleteUserUseCase, userRepository);
  const productController = new ProductController(createProductUseCase, getProductsUseCase, getProductByIdUseCase, updateProductUseCase, deleteProductUseCase);
  const orderController = new OrderController(createOrderUseCase, getOrdersUseCase, getOrderByIdUseCase, updateOrderStatusUseCase, deleteOrderUseCase);

  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', createAuthRouter(authController));
  app.use('/api/users', createUserRouter(userController));
  app.use('/api/products', createProductRouter(productController));
  app.use('/api/orders', createOrderRouter(orderController));

  app.use(errorHandler);

  return app;
};
