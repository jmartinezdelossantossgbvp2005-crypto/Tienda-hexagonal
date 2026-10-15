import { config } from './env.js';

/**
 * Provee la configuración de conexión requerida por BullMQ e ioredis
 * Nota: BullMQ exige obligatoriamente maxRetriesPerRequest: null
 */
export const getRedisConnectionOptions = () => {
  if (config.redis?.url && (config.redis.url.startsWith('redis://') || config.redis.url.startsWith('rediss://'))) {
    try {
      const parsed = new URL(config.redis.url);
      return {
        host: parsed.hostname || '127.0.0.1',
        port: parseInt(parsed.port || '6379', 10),
        username: parsed.username || undefined,
        password: parsed.password || undefined,
        maxRetriesPerRequest: null
      };
    } catch {
      // Ignorar error de parsing y usar valores por defecto
    }
  }

  return {
    host: config.redis?.host || '127.0.0.1',
    port: parseInt(config.redis?.port || '6379', 10),
    password: config.redis?.password || undefined,
    maxRetriesPerRequest: null
  };
};
