export class Order {
  constructor({ id = null, userId, items = [], totalAmount = 0, status = 'pending', createdAt = new Date() }) {
    this.id = id;
    this.userId = userId;
    this.items = items;
    this.status = status;
    this.createdAt = createdAt;
    this.totalAmount = items.length > 0 ? this.calculateTotal() : Number(totalAmount);
    this.validate();
  }

  validate() {
    if (!this.userId) {
      throw new Error('El identificador de usuario es requerido para asociar el pedido');
    }
    const validStatuses = ['pending', 'completed', 'cancelled'];
    if (!validStatuses.includes(this.status)) {
      throw new Error(`Estado de pedido inválido. Estados permitidos: ${validStatuses.join(', ')}`);
    }
  }

  calculateTotal() {
    const sum = this.items.reduce((accumulator, currentItem) => {
      return accumulator + currentItem.getSubtotal();
    }, 0);
    return Number(sum.toFixed(2));
  }

  markAsCompleted() {
    if (this.status === 'cancelled') {
      throw new Error('No se puede completar un pedido cancelado');
    }
    this.status = 'completed';
  }

  markAsCancelled() {
    if (this.status === 'completed') {
      throw new Error('No se puede cancelar un pedido previamente completado');
    }
    this.status = 'cancelled';
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      items: this.items.map(item => item.toJSON()),
      totalAmount: this.totalAmount,
      status: this.status,
      createdAt: this.createdAt
    };
  }
}
