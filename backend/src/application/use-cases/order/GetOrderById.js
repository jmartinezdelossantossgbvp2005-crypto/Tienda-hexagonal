export class GetOrderById {
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
  }

  async execute(id) {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new Error('Pedido no encontrado');
    }
    return order.toJSON();
  }
}
