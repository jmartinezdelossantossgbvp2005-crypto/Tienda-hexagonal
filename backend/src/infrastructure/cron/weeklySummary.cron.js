import cron from 'node-cron';

/**
 * Configura la tarea programada para la generación y envío del resumen semanal
 * @param {import('../../application/use-cases/notifications/GenerateWeeklySummary.js').GenerateWeeklySummary} generateWeeklySummaryUseCase
 */
export const initWeeklySummaryCron = (generateWeeklySummaryUseCase) => {
  // Ejecutar todos los lunes a las 09:00 AM (hora del servidor)
  // Expresión Cron: Minuto (0), Hora (9), Día del mes (*), Mes (*), Día de la semana (1 = Lunes)
  const cronScheduleExpression = '0 9 * * 1';

  const scheduledTask = cron.schedule(cronScheduleExpression, async () => {
    console.log('⏰ [CRON Semanal] Iniciando tarea programada de resumen semanal...');
    try {
      const summary = await generateWeeklySummaryUseCase.execute();
      console.log(`✅ [CRON Semanal] Resumen semanal generado y encolado satisfactoriamente (${summary.orders.total} pedidos procesados).`);
    } catch (error) {
      console.error('❌ [CRON Semanal] Error ejecutando tarea de resumen semanal:', error.message);
    }
  });

  console.log(`✅ Cron de Resumen Semanal programado con la regla "${cronScheduleExpression}" (Lunes 09:00 AM)`);

  return {
    scheduledTask,
    // Permite disparar manualmente la tarea para pruebas inmediatas
    runNow: async () => {
      console.log('🚀 [CRON Semanal] Disparo manual solicitado...');
      return await generateWeeklySummaryUseCase.execute();
    }
  };
};
