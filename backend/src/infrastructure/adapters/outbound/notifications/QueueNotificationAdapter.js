import { Queue } from 'bullmq';
import nodemailer from 'nodemailer';
import { NotificationPort } from '../../../../application/ports/NotificationPort.js';
import { getRedisConnectionOptions } from '../../../config/redis.js';
import { config } from '../../../config/env.js';

/**
 * Adaptador de Notificaciones Asíncronas mediante BullMQ y Redis
 * Incluye fallback directo en caso de que Redis no se encuentre activo localmente
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
      if (err.code !== 'ECONNREFUSED') {
        console.warn('⚠️ QueueNotificationAdapter (emailQueue):', err.message);
      }
    });

    this.telegramQueue.on('error', (err) => {
      if (err.code !== 'ECONNREFUSED') {
        console.warn('⚠️ QueueNotificationAdapter (telegramQueue):', err.message);
      }
    });
  }

  /**
   * Encola alertas de inventario crítico para Email y Telegram (o envía directo si Redis no está disponible)
   * @param {Object} productData
   */
  async sendLowStockAlert(productData) {
    let queued = false;

    try {
      const jobPayload = {
        type: 'LOW_STOCK_ALERT',
        data: productData,
        queuedAt: new Date().toISOString()
      };

      const jobOptions = {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { age: 3600, count: 100 },
        removeOnFail: { age: 86400 * 7, count: 500 }
      };

      // Si Redis no responde en 400ms, salta al fallback directo
      const enqueued = await Promise.race([
        Promise.all([
          this.emailQueue.add('low-stock-alert-email', jobPayload, jobOptions),
          this.telegramQueue.add('low-stock-alert-telegram', jobPayload, jobOptions)
        ]).then(() => true),
        new Promise(resolve => setTimeout(() => resolve(false), 400))
      ]);

      queued = Boolean(enqueued);
    } catch {
      queued = false;
    }

    if (!queued) {
      await this.sendDirectLowStock(productData);
    }
  }

  /**
   * Encola el resumen semanal de ventas e inventario
   * @param {Object} summaryData
   */
  async sendWeeklySummary(summaryData) {
    let queued = false;

    try {
      const jobPayload = {
        type: 'WEEKLY_SUMMARY',
        data: summaryData,
        queuedAt: new Date().toISOString()
      };

      const jobOptions = {
        attempts: 3,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: { age: 3600, count: 50 },
        removeOnFail: { age: 86400 * 7, count: 200 }
      };

      const enqueued = await Promise.race([
        Promise.all([
          this.emailQueue.add('weekly-summary-email', jobPayload, jobOptions),
          this.telegramQueue.add('weekly-summary-telegram', jobPayload, jobOptions)
        ]).then(() => true),
        new Promise(resolve => setTimeout(() => resolve(false), 400))
      ]);

      queued = Boolean(enqueued);
    } catch {
      queued = false;
    }

    if (!queued) {
      await this.sendDirectWeeklySummary(summaryData);
    }
  }

  /**
   * Fallback de entrega directa para alertas de stock bajo
   */
  async sendDirectLowStock(productData) {
    const promises = [];

    // 1. Notificación a Telegram
    if (config.telegram?.botToken && config.telegram?.chatId) {
      const markdown = (
        `🚨 *¡ALERTA DE INVENTARIO CRÍTICO!* 🚨\n\n` +
        `📦 *Producto:* ${productData.productName || productData.name}\n` +
        `📉 *Stock Restante:* *${productData.remainingStock}* unidad(es)\n` +
        `⚠️ *Umbral de Alerta:* ${productData.threshold} unidad(es)\n` +
        `🆔 *ID:* \`${productData.productId || productData.id}\`\n\n` +
        (productData.imageUrl ? `🔗 [Ver Imagen](${productData.imageUrl})\n\n` : '') +
        `_Por favor ingresa a la plataforma para coordinar el abastecimiento con proveedores._`
      );

      promises.push(
        fetch(`https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: config.telegram.chatId,
            text: markdown,
            parse_mode: 'Markdown'
          })
        }).then(r => r.json()).then(res => {
          if (res.ok) console.log('✅ [Alerta Telegram] Notificación de stock bajo enviada con éxito.');
          else console.warn('⚠️ [Alerta Telegram] Error en respuesta de Telegram:', res);
        }).catch(err => console.warn('⚠️ [Alerta Telegram] Fallo:', err.message))
      );
    }

    // 2. Notificación por Correo (SMTP)
    if (config.smtp?.user && config.smtp?.pass) {
      const imgHtml = productData.imageUrl
        ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${productData.imageUrl}" alt="${productData.productName || productData.name}" style="max-width: 240px; max-height: 180px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0;" /></div>`
        : '';

      const html = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8" /></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 20px;">
          <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <div style="background: #dc2626; color: #fff; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 20px;">⚠️ Alerta de Inventario Crítico</h1>
            </div>
            <div style="padding: 24px;">
              ${imgHtml}
              <h2 style="margin-top: 0; color: #0f172a;">${productData.productName || productData.name}</h2>
              <p style="color: #475569; font-size: 14px;">El stock disponible para este producto ha caído por debajo del umbral de seguridad (${productData.threshold} unidades).</p>
              <div style="background: #f1f5f9; padding: 14px; border-radius: 8px; margin: 16px 0;">
                <p style="margin: 0; font-size: 14px;"><b>Stock restante:</b> <span style="color: #dc2626; font-size: 16px; font-weight: bold;">${productData.remainingStock} unidad(es)</span></p>
                <p style="margin: 6px 0 0; font-size: 12px; color: #64748b;">ID: ${productData.productId || productData.id}</p>
              </div>
              <p style="font-size: 13px; color: #64748b;">Se sugiere ingresar al panel de administración para gestionar el reabastecimiento a la brevedad.</p>
            </div>
            <div style="background: #f8fafc; padding: 12px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
              Tienda Hexagonal &bull; Sistema Automatizado de Alertas
            </div>
          </div>
        </body>
        </html>
      `;

      promises.push(
        (async () => {
          try {
            const transporter = nodemailer.createTransport({
              host: config.smtp.host,
              port: config.smtp.port,
              secure: config.smtp.secure,
              auth: {
                user: config.smtp.user,
                pass: config.smtp.pass
              }
            });
            await transporter.sendMail({
              from: `Tienda Hexagonal <${config.smtp.user}>`,
              to: config.smtp.adminEmail,
              subject: `⚠️ [ALERTA] Stock Bajo: ${productData.productName || productData.name}`,
              html
            });
            console.log('✅ [Alerta Email] Correo de alerta enviado a', config.smtp.adminEmail);
          } catch (err) {
            console.warn('⚠️ [Alerta Email] Error enviando correo:', err.message);
          }
        })()
      );
    }

    await Promise.allSettled(promises);
  }

  /**
   * Fallback de entrega directa para resumen semanal
   */
  async sendDirectWeeklySummary(summaryData) {
    if (config.telegram?.botToken && config.telegram?.chatId) {
      let itemsText = '';
      if (summaryData.inventory?.criticalItems?.length) {
        itemsText = `\n⚠️ *Artículos Críticos:*\n` +
          summaryData.inventory.criticalItems.map(i => `• ${i.name} (Stock: *${i.stock}*)`).join('\n');
      }

      const markdown = (
        `📊 *RESUMEN SEMANAL DE OPERACIONES*\n` +
        `🗓 *Periodo:* ${summaryData.periodStart} - ${summaryData.periodEnd}\n\n` +
        `💰 *Ventas Totales:* *$${summaryData.orders?.totalRevenue || 0}*\n` +
        `📦 *Pedidos Recibidos:* *${summaryData.orders?.total || 0}*\n` +
        `✅ *Completados:* ${summaryData.orders?.completed || 0} | ⏳ *Pendientes:* ${summaryData.orders?.pending || 0}\n\n` +
        `🏪 *Inventario Total:* ${summaryData.inventory?.totalProducts || 0} artículos\n` +
        `🚨 *Bajo Stock:* ${summaryData.inventory?.lowStockCount || 0} artículos\n` +
        itemsText
      );

      try {
        await fetch(`https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: config.telegram.chatId,
            text: markdown,
            parse_mode: 'Markdown'
          })
        });
      } catch (err) {
        console.warn('⚠️ [Direct Weekly Summary] Error:', err.message);
      }
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
