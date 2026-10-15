export class GenerateWeeklySummary {
  constructor(orderRepository, productRepository, notificationPort) {
    this.orderRepository = orderRepository;
    this.productRepository = productRepository;
    this.notificationPort = notificationPort;
  }

  async execute() {
    const endDate = new Date();
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // 1. Obtener órdenes y calcular métricas de ventas semanales
    const allOrders = await this.orderRepository.findAll();
    const weeklyOrders = (allOrders || []).filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });

    const totalRevenue = weeklyOrders.reduce((sum, order) => {
      return sum + Number(order.totalAmount || 0);
    }, 0);

    const completedOrders = weeklyOrders.filter(o => o.status === 'completed').length;
    const pendingOrders = weeklyOrders.filter(o => o.status === 'pending').length;
    const cancelledOrders = weeklyOrders.filter(o => o.status === 'cancelled').length;

    // 2. Obtener catálogo y evaluar niveles de inventario
    const allProducts = await this.productRepository.findAll();
    const lowStockThreshold = 5;
    const lowStockProducts = (allProducts || []).filter(p => p.stock <= lowStockThreshold);
    const outOfStockCount = (allProducts || []).filter(p => p.stock === 0).length;

    // 3. Estructurar resumen consolidado
    const summaryData = {
      periodStart: startDate.toLocaleDateString(),
      periodEnd: endDate.toLocaleDateString(),
      generatedAt: new Date().toISOString(),
      orders: {
        total: weeklyOrders.length,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        completed: completedOrders,
        pending: pendingOrders,
        cancelled: cancelledOrders
      },
      inventory: {
        totalProducts: (allProducts || []).length,
        outOfStockCount,
        lowStockCount: lowStockProducts.length,
        criticalItems: lowStockProducts.map(p => ({
          id: p.id,
          name: p.name,
          stock: p.stock,
          price: p.price,
          imageUrl: p.imageUrl || null
        }))
      }
    };

    // 4. Encolar o enviar al puerto de notificaciones
    if (this.notificationPort) {
      await this.notificationPort.sendWeeklySummary(summaryData);
    }

    return summaryData;
  }
}
