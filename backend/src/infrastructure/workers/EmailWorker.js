import { Worker } from 'bullmq';
import nodemailer from 'nodemailer';
import { config } from '../config/env.js';
import { getRedisConnectionOptions } from '../config/redis.js';

export class EmailWorker {
  constructor(connectionOptions = null) {
    this.connection = connectionOptions || getRedisConnectionOptions();
    this.worker = null;
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    if (config.smtp.user && config.smtp.pass) {
      const transportOptions = {
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass
        }
      };

      // Si se configuró firma criptográfica DKIM para dominio propio
      if (config.smtp.dkim?.domainName && config.smtp.dkim?.privateKey) {
        transportOptions.dkim = {
          domainName: config.smtp.dkim.domainName,
          keySelector: config.smtp.dkim.keySelector || 'default',
          privateKey: config.smtp.dkim.privateKey
        };
      }

      this.transporter = nodemailer.createTransport(transportOptions);
    } else {
      console.warn('⚠️ EmailWorker: Credenciales SMTP incompletas. Los correos se simularán en consola hasta definir SMTP_USER y SMTP_PASS.');
    }
  }

  buildLowStockHtml(product) {
    const imgHtml = product.imageUrl
      ? `<div style="text-align: center; margin-bottom: 20px;">
           <img src="${product.imageUrl}" alt="${product.name}" style="max-width: 240px; max-height: 180px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0;" />
         </div>`
      : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
          .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: #dc2626; color: #ffffff; padding: 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
          .content { padding: 24px; }
          .badge { display: inline-block; padding: 4px 10px; background-color: #fee2e2; color: #991b1b; border-radius: 9999px; font-weight: 700; font-size: 13px; }
          .details { margin: 20px 0; padding: 16px; background-color: #f1f5f9; border-radius: 8px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
          .footer { padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; background: #f8fafc; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Alerta de Inventario Crítico</h1>
          </div>
          <div class="content">
            ${imgHtml}
            <h2 style="margin-top: 0; color: #0f172a; font-size: 18px;">${product.name}</h2>
            <p style="font-size: 14px; color: #475569; line-height: 1.5;">
              El stock disponible para este producto ha caído por debajo del umbral de seguridad establecido (${product.threshold} unidades).
            </p>
            <div class="details">
              <div class="row">
                <strong>ID de Producto:</strong>
                <span>${product.productId || product.id}</span>
              </div>
              <div class="row">
                <strong>Existencias Restantes:</strong>
                <span class="badge">${product.remainingStock} unidad(es)</span>
              </div>
              <div class="row">
                <strong>Umbral de Notificación:</strong>
                <span>${product.threshold} unidades</span>
              </div>
            </div>
            <p style="font-size: 13px; color: #64748b;">
              Se sugiere ingresar al panel de administración para gestionar el reabastecimiento a la brevedad.
            </p>
          </div>
          <div class="footer">
            Tienda Hexagonal &bull; Sistema Automatizado de Notificaciones
          </div>
        </div>
      </body>
      </html>
    `;
  }

  buildWeeklySummaryHtml(summary) {
    const criticalList = summary.inventory?.criticalItems?.length
      ? summary.inventory.criticalItems.map(item => `
          <li style="margin-bottom: 8px;">
            <strong>${item.name}</strong> - Stock restante: <span style="color: #dc2626; font-weight: 700;">${item.stock}</span> ($${Number(item.price).toFixed(2)})
          </li>
        `).join('')
      : '<p style="color: #16a34a;">No hay productos con inventario crítico.</p>';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
          .header { background: #2563eb; color: #ffffff; padding: 24px; text-align: center; }
          .content { padding: 24px; }
          .metric-card { background: #eff6ff; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
          .metric-val { font-size: 24px; font-weight: 700; color: #1e40af; }
          .metric-label { font-size: 13px; color: #3b82f6; text-transform: uppercase; font-weight: 600; }
          .footer { padding: 16px; text-align: center; font-size: 12px; color: #64748b; background: #f8fafc; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 20px;">📊 Resumen Semanal de Operaciones</h1>
            <p style="margin: 6px 0 0; opacity: 0.9; font-size: 13px;">${summary.periodStart} - ${summary.periodEnd}</p>
          </div>
          <div class="content">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
              <div class="metric-card">
                <div class="metric-label">Ingresos Semanales</div>
                <div class="metric-val">$${summary.orders?.totalRevenue || 0}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Órdenes Generadas</div>
                <div class="metric-val">${summary.orders?.total || 0}</div>
              </div>
            </div>

            <h3 style="font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Estado de Inventario</h3>
            <p style="font-size: 14px; margin: 8px 0;">Total de artículos en catálogo: <strong>${summary.inventory?.totalProducts || 0}</strong></p>
            <p style="font-size: 14px; margin: 8px 0;">Artículos con stock crítico: <strong>${summary.inventory?.lowStockCount || 0}</strong></p>

            <h4 style="font-size: 14px; margin-top: 16px; color: #dc2626;">Atención prioritaria:</h4>
            <ul style="font-size: 13px; padding-left: 20px;">
              ${criticalList}
            </ul>
          </div>
          <div class="footer">
            Tienda Hexagonal &bull; Reporte Consolidado
          </div>
        </div>
      </body>
      </html>
    `;
  }

  start() {
    this.worker = new Worker(
      'email-notifications',
      async (job) => {
        const { type, data } = job.data;
        console.log(`[EmailWorker] Procesando trabajo ${job.id} de tipo ${type}...`);

        if (type === 'LOW_STOCK_ALERT') {
          const html = this.buildLowStockHtml(data);
          const mailOptions = {
            from: `"Tienda Hexagonal" <${config.smtp.user || 'no-reply@tienda.com'}>`,
            to: config.smtp.adminEmail,
            subject: `⚠️ [ALERTA] Stock Bajo: ${data.productName}`,
            html
          };

          if (this.transporter) {
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`[EmailWorker] Correo de alerta enviado a ${config.smtp.adminEmail}: ${info.messageId}`);
          } else {
            console.log(`[EmailWorker Simulación] Enviar correo de alerta a ${config.smtp.adminEmail} para "${data.productName}"`);
          }
        } else if (type === 'WEEKLY_SUMMARY') {
          const html = this.buildWeeklySummaryHtml(data);
          const mailOptions = {
            from: `"Tienda Hexagonal" <${config.smtp.user || 'no-reply@tienda.com'}>`,
            to: config.smtp.adminEmail,
            subject: `📊 Resumen Semanal de Ventas e Inventario`,
            html
          };

          if (this.transporter) {
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`[EmailWorker] Resumen semanal enviado a ${config.smtp.adminEmail}: ${info.messageId}`);
          } else {
            console.log(`[EmailWorker Simulación] Enviar resumen semanal a ${config.smtp.adminEmail}`);
          }
        }
      },
      { connection: this.connection }
    );

    this.worker.on('failed', (job, err) => {
      console.error(`[EmailWorker] Falló el trabajo ${job?.id}:`, err.message);
    });

    this.worker.on('error', (err) => {
      if (err.code !== 'ECONNREFUSED') {
        console.warn('⚠️ [EmailWorker] Error de conexión en cola:', err.message);
      }
    });

    console.log('✅ EmailWorker inicializado y a la escucha en "email-notifications"');
    return this.worker;
  }

  async close() {
    if (this.worker) {
      await this.worker.close();
    }
  }
}
