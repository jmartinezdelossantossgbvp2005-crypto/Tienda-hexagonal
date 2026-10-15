/**
 * Puerto de Notificación (Notification Port)
 * Define el contrato para el sistema de alertas y reportes asíncronos
 */
export class NotificationPort {
  /**
   * Encola o envía una alerta de stock bajo
   * @param {Object} productData Datos del producto ({ id, name, remainingStock, previousStock, imageUrl, threshold })
   * @returns {Promise<void>}
   */
  async sendLowStockAlert(productData) {
    throw new Error('Método no implementado: sendLowStockAlert');
  }

  /**
   * Encola o envía el resumen semanal de operaciones
   * @param {Object} summaryData Métricas consolidadas de ventas y catálogo
   * @returns {Promise<void>}
   */
  async sendWeeklySummary(summaryData) {
    throw new Error('Método no implementado: sendWeeklySummary');
  }
}
