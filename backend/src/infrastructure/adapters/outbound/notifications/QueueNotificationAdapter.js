import { Queue } from 'bullmq';
import { NotificationPort } from '../../../../application/ports/NotificationPort.js';
import { getRedisConnectionOptions } from '../../../config/redis.js';

/**
 * Adaptador de Notificaciones Asíncronas mediante BullMQ y Redis
 * Encola eventos para procesamiento desacoplado en segundo plano
 */
export class QueueNotificationAdapter extends NotificationPort {
  constructor(connectionOptions = null) {
    super();
    this.connection = connectionOptions || getRedisConnectionOptions();

    // Colas BullMQ dedicadas por canal de entrega
    this.emailQueue = new Queue('email-notifications', { connection: this.connection });
    this.telegramQueue = new Queue('telegram-notifications', { connection: this.connection });

    // Evitar que errores de conexión a Redis (ej. ECONNREFUSED en desarrollo local) tumben el proceso Node
    this.emailQueue.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        // Redis no disponible localmente
      } else {
        console.warn('⚠️ QueueNotificationAdapter (emailQueue):', err.message);
      }
    });

    this.telegramQueue.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        // Redis no disponible localmente
      } else {
        console.warn('⚠️ QueueNotificationAdapter (telegramQueue):', err.message);
      }
    });
  }

  /**
   * Encola alertas de inventario crítico para Email y Telegram
   * @param {Object} productData
   */
  async sendLowStockAlert(productData) {
    try {
      const jobPayload = {
        type: 'LOW_STOCK_ALERT',
        data: productData,
        queuedAt: new Date().toISOString()
      };

      const jobOptions = {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: {
          age: 3600, // Limpiar trabajos completados mayores a 1 hora
          count: 100 // Máximo 100 registros en memoria
        },
        removeOnFail: {
          age: 86400 * 7, // Limpiar fallos mayores a 7 días
          count: 500 // Máximo 500 registros en memoria
        }
      };

      await Promise.allSettled([
        this.emailQueue.add('low-stock-alert-email', jobPayload, jobOptions),
        this.telegramQueue.add('low-stock-alert-telegram', jobPayload, jobOptions)
      ]);
    } catch (error) {
      console.warn('⚠️ QueueNotificationAdapter: Error al registrar trabajo en Redis:', error.message);
    }
  }

  /**
   * Encola el resumen semanal de ventas e inventario
   * @param {Object} summaryData
   */
  async sendWeeklySummary(summaryData) {
    try {
      const jobPayload = {
        type: 'WEEKLY_SUMMARY',
        data: summaryData,
        queuedAt: new Date().toISOString()
      };

      const jobOptions = {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 3000
        },
        removeOnComplete: {
          age: 3600,
          count: 50
        },
        removeOnFail: {
          age: 86400 * 7,
          count: 200
        }
      };

      await Promise.allSettled([
        this.emailQueue.add('weekly-summary-email', jobPayload, jobOptions),
        this.telegramQueue.add('weekly-summary-telegram', jobPayload, jobOptions)
      ]);
    } catch (error) {
      console.warn('⚠️ QueueNotificationAdapter: Error al registrar resumen semanal en Redis:', error.message);
    }
  }

  /**
   * Cierra ordenadamente las conexiones a las colas
   */
  async close() {
    await Promise.allSettled([
      this.emailQueue.close(),
      this.telegramQueue.close()
    ]);
  }
}
