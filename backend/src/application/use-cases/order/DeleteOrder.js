export class DeleteOrder {
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
  }

  async execute(id) {
    const existing = await this.orderRepository.findById(id);
    if (!existing) {
      throw new Error('Pedido no encontrado');
    }
    return await this.orderRepository.delete(id);
  }
}
