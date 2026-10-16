import { config } from '../../../../config/env.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
let TelegramApiClass = null;

try {
  const telegramPkg = require('node-telegram-bot-api');
  TelegramApiClass = telegramPkg.Api || telegramPkg.default || telegramPkg;
} catch (err) {
  console.warn('⚠️ TelegramWebhookController: No se pudo cargar node-telegram-bot-api:', err.message);
}

export class TelegramWebhookController {
  constructor(productRepository, generateWeeklySummaryUseCase) {
    this.productRepository = productRepository;
    this.generateWeeklySummaryUseCase = generateWeeklySummaryUseCase;
    this.client = null;
    this.initClient();
  }

  initClient() {
    if (config.telegram?.botToken && TelegramApiClass) {
      try {
        const isPolling = !config.telegram.webhookUrl && config.nodeEnv === 'development';
        this.client = new TelegramApiClass(config.telegram.botToken, { polling: isPolling });

        if (isPolling) {
          this.client.on('message', async (message) => {
            await this.processMessage(message);
          });
          console.log('🤖 [TelegramBot] Modo POLLING activo para pruebas interactivas en desarrollo local.');
        }
      } catch (err) {
        console.warn('⚠️ Error al instanciar cliente de Telegram para Webhook:', err.message);
      }
    }
  }

  handleWebhook = async (req, res) => {
    // 1. Validar Token Secreto del Webhook para seguridad
    const secretTokenHeader = req.headers['x-telegram-bot-api-secret-token'];
    if (config.telegram?.webhookSecret && secretTokenHeader !== config.telegram.webhookSecret) {
      return res.status(401).json({ error: 'Token de webhook no autorizado' });
    }

    // Responder 200 OK de inmediato a Telegram para evitar timeouts
    res.status(200).json({ ok: true });

    const update = req.body;
    const message = update?.message;
    if (message) {
      await this.processMessage(message);
    }
  };

  async processMessage(message) {
    if (!message || !message.text) return;

    const chatId = message.chat.id;
    const text = message.text.trim();

    try {
      if (text.startsWith('/start') || text.startsWith('/ayuda') || text.startsWith('/help')) {
        const welcomeText = (
          `🤖 *Bot de Administración - Tienda Hexagonal*\n\n` +
          `Comandos disponibles:\n` +
          `📦 */stock* - Consulta el estado del inventario y alertas\n` +
          `📊 */resumen* - Genera el reporte semanal de ventas en tiempo real\n` +
          `ℹ️ */id* - Muestra el ID de este chat para configuración\n`
        );
        await this.sendMessage(chatId, welcomeText);
      } else if (text.startsWith('/id')) {
        await this.sendMessage(chatId, `Tu Chat ID es: \`${chatId}\``);
      } else if (text.startsWith('/stock') || text.startsWith('/inventario')) {
        const products = await this.productRepository.findAll();
        const lowStock = (products || []).filter(p => p.stock <= (config.notifications?.lowStockThreshold || 5));

        let response = `📦 *Estado de Inventario Actual*\nTotal productos: *${products.length}*\n\n`;
        if (lowStock.length > 0) {
          response += `⚠️ *Artículos con stock crítico:*\n`;
          response += lowStock.map(p => `• *${p.name}*: ${p.stock} unidad(es)`).join('\n');
        } else {
          response += `✅ Todos los productos tienen existencias suficientes.`;
        }
        await this.sendMessage(chatId, response);
      } else if (text.startsWith('/resumen') || text.startsWith('/reporte')) {
        await this.sendMessage(chatId, `⏳ Generando resumen de operaciones...`);
        const summary = await this.generateWeeklySummaryUseCase.execute();
        const response = (
          `📊 *Resumen de Operaciones Generado*\n` +
          `🗓 *Periodo:* ${summary.periodStart} al ${summary.periodEnd}\n` +
          `💰 *Ingresos:* *$${summary.orders?.totalRevenue || 0}*\n` +
          `🛍 *Pedidos:* ${summary.orders?.total || 0} (${summary.orders?.completed || 0} completados)\n` +
          `📦 *Stock crítico:* ${summary.inventory?.lowStockCount || 0} productos`
        );
        await this.sendMessage(chatId, response);
      }
    } catch (err) {
      console.error('[TelegramWebhookController] Error procesando comando:', err.message);
      await this.sendMessage(chatId, `❌ Error procesando solicitud: ${err.message}`);
    }
  };

  async sendMessage(chatId, text) {
    if (this.client && typeof this.client.sendMessage === 'function') {
      try {
        await this.client.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      } catch (err) {
        console.warn('[TelegramWebhookController] Fallo al enviar mensaje:', err.message);
      }
    }
  }
}
