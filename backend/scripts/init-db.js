import pkg from 'pg';
import bcrypt from 'bcrypt';
import { config } from '../src/infrastructure/config/env.js';

const { Client, Pool } = pkg;

async function createDatabaseIfNotExists() {
  const rootClient = new Client({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: 'postgres',
    ssl: config.db.ssl ? { rejectUnauthorized: false } : false
  });

  try {
    await rootClient.connect();
    const res = await rootClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [config.db.name]
    );

    if (res.rowCount === 0) {
      console.log(`Creando base de datos '${config.db.name}'...`);
      // Database names cannot be parameterized in SQL queries, safe sanitize identifier
      const safeDbName = config.db.name.replace(/[^a-zA-Z0-9_]/g, '');
      await rootClient.query(`CREATE DATABASE "${safeDbName}"`);
      console.log(`Base de datos '${config.db.name}' creada exitosamente.`);
    } else {
      console.log(`La base de datos '${config.db.name}' ya existe.`);
    }
  } catch (err) {
    console.warn(`Aviso al verificar/crear base de datos: ${err.message}`);
  } finally {
    await rootClient.end();
  }
}

async function initializeSchemaAndSeed() {
  const pool = new Pool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.name,
    ssl: config.db.ssl ? { rejectUnauthorized: false } : false
  });

  try {
    console.log(`Conectando a '${config.db.name}' para inicializar tablas...`);

    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(150) NOT NULL,
        description TEXT,
        price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
        stock INTEGER NOT NULL CHECK (stock >= 0),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
        status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
        subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0)
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
    `);
    console.log('Tablas y esquemas verificados/creados correctamente.');

    // Seed sample products if table is empty
    const productCheck = await pool.query(`SELECT COUNT(*) FROM products`);
    if (parseInt(productCheck.rows[0].count, 10) === 0) {
      console.log('Sembrando catálogo de productos de prueba...');
      await pool.query(`
        INSERT INTO products (name, description, price, stock)
        VALUES 
          ('Laptop Ultrabook Pro', 'Portátil de alta gama con procesador de última generación', 1250.00, 15),
          ('Mouse Inalámbrico Ergonómico', 'Sensor óptico de alta precisión y batería recargable', 35.50, 40),
          ('Teclado Mecánico RGB', 'Switches táctiles silenciosos y retroiluminación personalizable', 85.00, 25),
          ('Monitor 27 IPS 144Hz', 'Pantalla QHD con colores vivos y tasa de refresco fluida', 320.00, 10);
      `);
      console.log('Productos de prueba sembrados.');
    }

    // Seed Admin User configured in environment variables
    const adminEmail = config.admin?.email || 'admin@tienda.com';
    const adminPassword = config.admin?.password || '12345';
    const adminName = config.admin?.name || 'Administrador General';

    console.log(`Configurando usuario administrador (${adminEmail})...`);
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

    const adminUpsertQuery = `
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, 'admin')
      ON CONFLICT (email) 
      DO UPDATE SET 
        name = EXCLUDED.name,
        password = EXCLUDED.password,
        role = 'admin'
      RETURNING id, name, email, role;
    `;
    const resAdmin = await pool.query(adminUpsertQuery, [adminName, adminEmail, hashedAdminPassword]);
    console.log('Usuario Administrador configurado exitosamente:');
    console.log(`  - Nombre: ${resAdmin.rows[0].name} | Email: ${resAdmin.rows[0].email} | Rol: ${resAdmin.rows[0].role}`);

    // If config admin was custom, also ensure default admin@tienda.com exists
    if (adminEmail !== 'admin@tienda.com') {
      const defaultAdminPass = await bcrypt.hash('12345', 10);
      await pool.query(adminUpsertQuery, ['Administrador General', 'admin@tienda.com', defaultAdminPass]);
      console.log('  - Usuario admin@tienda.com adicional asegurado.');
    }

    // Seed Demo Customer User
    console.log('Configurando usuario cliente demo (cliente@tienda.com)...');
    const hashedCustomerPassword = await bcrypt.hash('12345', 10);
    const customerUpsertQuery = `
      INSERT INTO users (name, email, password, role)
      VALUES ('Cliente Demo', 'cliente@tienda.com', $1, 'customer')
      ON CONFLICT (email) 
      DO UPDATE SET 
        password = EXCLUDED.password,
        role = 'customer'
      RETURNING id, name, email, role;
    `;
    const resCust = await pool.query(customerUpsertQuery, [hashedCustomerPassword]);
    console.log('Usuario Cliente Demo configurado exitosamente:');
    console.log(`  - Nombre: ${resCust.rows[0].name} | Email: ${resCust.rows[0].email} | Rol: ${resCust.rows[0].role}`);

  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function run() {
  await createDatabaseIfNotExists();
  await initializeSchemaAndSeed();
  console.log('Inicialización de base de datos completada con éxito.');
}

run();
