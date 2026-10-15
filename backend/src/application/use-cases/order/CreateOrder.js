import { Order } from '../../../domain/entities/Order.js';
import { OrderItem } from '../../../domain/entities/OrderItem.js';

export class CreateOrder {
  constructor(orderRepository, productRepository, userRepository, notificationPort = null, lowStockThreshold = 5) {
    this.orderRepository = orderRepository;
    this.productRepository = productRepository;
    this.userRepository = userRepository;
    this.notificationPort = notificationPort;
    this.lowStockThreshold = lowStockThreshold;
  }

  async execute({ userId, items }) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('El pedido debe incluir al menos un producto');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('El usuario solicitante no existe');
    }

    const orderItems = [];
    const productsMap = new Map();

    for (const item of items) {
      const product = await this.productRepository.findById(item.productId);
      if (!product) {
        throw new Error(`Producto con ID ${item.productId} no encontrado`);
      }

      if (!product.hasSufficientStock(item.quantity)) {
        throw new Error(`Stock insuficiente para "${product.name}". Solicitado: ${item.quantity}, Disponible: ${product.stock}`);
      }

      productsMap.set(item.productId, product);

      const orderItem = new OrderItem({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price
      });

      orderItems.push(orderItem);
    }

    const order = new Order({
      userId,
      items: orderItems,
      status: 'pending'
    });

    const savedOrder = await this.orderRepository.createWithItems(order, orderItems);

    // Verificar si el inventario resultante cayó bajo el umbral de alerta
    if (this.notificationPort) {
      for (const item of items) {
        const product = productsMap.get(item.productId);
        const resultingStock = product.stock - item.quantity;

        if (resultingStock <= this.lowStockThreshold) {
          try {
            await this.notificationPort.sendLowStockAlert({
              productId: product.id,
              productName: product.name,
              remainingStock: resultingStock,
              threshold: this.lowStockThreshold,
              imageUrl: product.imageUrl || null
            });
          } catch (notifErr) {
            console.warn(`Aviso al encolar alerta de stock bajo para "${product.name}":`, notifErr.message);
          }
        }
      }
    }

    return savedOrder.toJSON();
  }
}
