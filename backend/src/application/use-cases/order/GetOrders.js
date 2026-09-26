export class GetOrders {
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
  }

  async execute(userId = null) {
    const orders = userId
      ? await this.orderRepository.findByUserId(userId)
      : await this.orderRepository.findAll();
    return orders.map(order => order.toJSON());
  }
}
