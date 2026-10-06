import pkg from 'pg';
import { config } from '../../../config/env.js';

const { Pool } = pkg;

const poolConfig = {
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.name
};

if (config.db.ssl) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

export const pool = new Pool(poolConfig);

