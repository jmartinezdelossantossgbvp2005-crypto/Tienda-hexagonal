import { Order } from '../../../domain/entities/Order.js';
import { OrderItem } from '../../../domain/entities/OrderItem.js';

export class CreateOrder {
  constructor(orderRepository, productRepository, userRepository) {
    this.orderRepository = orderRepository;
    this.productRepository = productRepository;
    this.userRepository = userRepository;
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
    for (const item of items) {
      const product = await this.productRepository.findById(item.productId);
      if (!product) {
        throw new Error(`Producto con ID ${item.productId} no encontrado`);
      }

      if (!product.hasSufficientStock(item.quantity)) {
        throw new Error(`Stock insuficiente para "${product.name}". Solicitado: ${item.quantity}, Disponible: ${product.stock}`);
      }

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
    return savedOrder.toJSON();
  }
}
