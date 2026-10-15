import { pool } from './infrastructure/adapters/outbound/postgres/connection.js';
import { PostgresProductRepository } from './infrastructure/adapters/outbound/postgres/PostgresProductRepository.js';
import { PostgresOrderRepository } from './infrastructure/adapters/outbound/postgres/PostgresOrderRepository.js';
import { QueueNotificationAdapter } from './infrastructure/adapters/outbound/notifications/QueueNotificationAdapter.js';
import { GenerateWeeklySummary } from './application/use-cases/notifications/GenerateWeeklySummary.js';
import { EmailWorker } from './infrastructure/workers/EmailWorker.js';
import { TelegramWorker } from './infrastructure/workers/TelegramWorker.js';
import { initWeeklySummaryCron } from './infrastructure/cron/weeklySummary.cron.js';

console.log('=====================================================');
console.log('🛠️  INICIANDO CONTENEDOR DEDICADO DE WORKERS Y CRON  🛠️');
console.log('=====================================================');

const orderRepository = new PostgresOrderRepository(pool);
const productRepository = new PostgresProductRepository(pool);
const notificationService = new QueueNotificationAdapter();

const generateWeeklySummaryUseCase = new GenerateWeeklySummary(
  orderRepository,
  productRepository,
  notificationService
);

// 1. Inicializar Worker de Correo Electrónico
const emailWorker = new EmailWorker();
emailWorker.start();

// 2. Inicializar Worker de Telegram
const telegramWorker = new TelegramWorker();
telegramWorker.start();

// 3. Inicializar Cronjob de Resumen Semanal
const weeklyCron = initWeeklySummaryCron(generateWeeklySummaryUseCase);

console.log('🚀 Procesamiento en segundo plano activo y aislado del servidor HTTP.');

// Cierre ordenado (Graceful Shutdown)
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Recibida señal ${signal}. Cerrando workers de manera ordenada...`);
  try {
    if (weeklyCron?.scheduledTask) {
      weeklyCron.scheduledTask.stop();
    }
    await Promise.allSettled([
      emailWorker.close(),
      telegramWorker.close(),
      notificationService.close(),
      pool.end()
    ]);
    console.log('✅ Conexiones cerradas limpiamente.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error durante el cierre de workers:', err.message);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
