import { Worker } from 'bullmq';
import { createRequire } from 'module';
import { config } from '../config/env.js';
import { getRedisConnectionOptions } from '../config/redis.js';

const require = createRequire(import.meta.url);
let TelegramApiClass = null;

try {
  const telegramPkg = require('node-telegram-bot-api');
  if (telegramPkg.Api) {
    TelegramApiClass = telegramPkg.Api;
  } else if (typeof telegramPkg === 'function') {
    TelegramApiClass = telegramPkg;
  } else if (telegramPkg.default) {
    TelegramApiClass = telegramPkg.default;
  }
} catch (err) {
  console.warn('⚠️ Error al cargar node-telegram-bot-api:', err.message);
}

export class TelegramWorker {
  constructor(connectionOptions = null) {
    this.connection = connectionOptions || getRedisConnectionOptions();
    this.worker = null;
    this.client = null;
    this.initClient();
  }

  initClient() {
    if (config.telegram?.botToken && config.telegram?.chatId && TelegramApiClass) {
      try {
        // En v2.x Api(token) o en v0.x TelegramBot(token, { polling: false })
        this.client = new TelegramApiClass(config.telegram.botToken, { polling: false });
      } catch (err) {
        console.warn('⚠️ No se pudo instanciar el cliente de Telegram:', err.message);
      }
    } else {
      console.warn('⚠️ TelegramWorker: Faltan credenciales de Telegram (TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID). Los mensajes se registrarán en consola hasta configurarlas.');
    }
  }

  formatLowStockMarkdown(product) {
    return (
      `🚨 *¡ALERTA DE INVENTARIO CRÍTICO!* 🚨\n\n` +
      `📦 *Producto:* ${product.productName || product.name}\n` +
      `📉 *Stock Restante:* *${product.remainingStock}* unidad(es)\n` +
      `⚠️ *Umbral de Alerta:* ${product.threshold} unidad(es)\n` +
      `🆔 *ID:* \`${product.productId || product.id}\`\n\n` +
      (product.imageUrl ? `🔗 [Ver Imagen en Alta Resolución](${product.imageUrl})\n\n` : '') +
      `_Por favor ingresa a la plataforma para coordinar el abastecimiento con proveedores._`
    );
  }

  formatWeeklySummaryMarkdown(summary) {
    let itemsText = '';
    if (summary.inventory?.criticalItems?.length) {
      itemsText = `\n⚠️ *Artículos Críticos:*\n` +
        summary.inventory.criticalItems.map(i => `• ${i.name} (Stock: *${i.stock}*)`).join('\n');
    }

    return (
      `📊 *RESUMEN SEMANAL DE OPERACIONES*\n` +
      `🗓 *Periodo:* ${summary.periodStart} - ${summary.periodEnd}\n\n` +
      `💰 *Ventas Totales:* *$${summary.orders?.totalRevenue || 0}*\n` +
      `📦 *Pedidos Recibidos:* *${summary.orders?.total || 0}*\n` +
      `✅ *Completados:* ${summary.orders?.completed || 0} | ⏳ *Pendientes:* ${summary.orders?.pending || 0}\n\n` +
      `🏪 *Inventario Total:* ${summary.inventory?.totalProducts || 0} artículos\n` +
      `🚨 *Bajo Stock:* ${summary.inventory?.lowStockCount || 0} artículos\n` +
      itemsText
    );
  }

  start() {
    this.worker = new Worker(
      'telegram-notifications',
      async (job) => {
        const { type, data } = job.data;
        console.log(`[TelegramWorker] Procesando trabajo ${job.id} de tipo ${type}...`);

        const chatId = config.telegram?.chatId;

        if (type === 'LOW_STOCK_ALERT') {
          const markdown = this.formatLowStockMarkdown(data);

          if (this.client && chatId) {
            try {
              if (data.imageUrl && typeof this.client.sendPhoto === 'function') {
                await this.client.sendPhoto(chatId, data.imageUrl, {
                  caption: markdown,
                  parse_mode: 'Markdown'
                });
              } else {
                await this.client.sendMessage(chatId, markdown, { parse_mode: 'Markdown' });
              }
              console.log(`[TelegramWorker] Alerta de stock enviada exitosamente al Chat ID ${chatId}`);
            } catch (err) {
              console.warn(`[TelegramWorker] Intento con foto falló (${err.message}). Reintentando como mensaje de texto plano/markdown...`);
              await this.client.sendMessage(chatId, markdown, { parse_mode: 'Markdown' });
            }
          } else {
            console.log(`[TelegramWorker Simulación] Enviar a Telegram Chat ${chatId || 'N/A'}:\n${markdown}`);
          }
        } else if (type === 'WEEKLY_SUMMARY') {
          const markdown = this.formatWeeklySummaryMarkdown(data);

          if (this.client && chatId) {
            await this.client.sendMessage(chatId, markdown, { parse_mode: 'Markdown' });
            console.log(`[TelegramWorker] Resumen semanal enviado exitosamente al Chat ID ${chatId}`);
          } else {
            console.log(`[TelegramWorker Simulación] Enviar a Telegram Chat ${chatId || 'N/A'}:\n${markdown}`);
          }
        }
      },
      { connection: this.connection }
    );

    this.worker.on('failed', (job, err) => {
      console.error(`[TelegramWorker] Falló el trabajo ${job?.id}:`, err.message);
    });

    this.worker.on('error', (err) => {
      if (err.code !== 'ECONNREFUSED') {
        console.warn('⚠️ [TelegramWorker] Error de conexión en cola:', err.message);
      }
    });

    console.log('✅ TelegramWorker inicializado y a la escucha en "telegram-notifications"');
    return this.worker;
  }

  async close() {
    if (this.worker) {
      await this.worker.close();
    }
  }
}
