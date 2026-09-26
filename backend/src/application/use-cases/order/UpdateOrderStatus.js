export class UpdateOrderStatus {
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
  }

  async execute(id, status) {
    const validStatuses = ['pending', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Estado inválido. Los estados permitidos son: ${validStatuses.join(', ')}`);
    }

    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new Error('Pedido no encontrado');
    }

    if (status === 'completed') {
      order.markAsCompleted();
    } else if (status === 'cancelled') {
      order.markAsCancelled();
    }

    const updated = await this.orderRepository.updateStatus(id, status);
    return updated.toJSON();
  }
}
