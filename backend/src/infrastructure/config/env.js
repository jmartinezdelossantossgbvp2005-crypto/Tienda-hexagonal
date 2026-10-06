import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    name: process.env.DB_NAME || 'ecommerce_hexagonal',
    ssl: process.env.DB_SSL === 'true'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  admin: {
    name: process.env.ADMIN_NAME || 'Admin',
    email: process.env.ADMIN_EMAIL || 'admin@tienda.com',
    password: process.env.ADMIN_PASSWORD || '12345'
  }
};

