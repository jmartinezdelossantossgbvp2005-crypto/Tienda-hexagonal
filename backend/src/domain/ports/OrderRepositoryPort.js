export class OrderRepositoryPort {
  async createWithItems(order, items) {
    throw new Error('Método no implementado');
  }

  async findById(id) {
    throw new Error('Método no implementado');
  }

  async findByUserId(userId) {
    throw new Error('Método no implementado');
  }

  async findAll() {
    throw new Error('Método no implementado');
  }

  async updateStatus(id, status) {
    throw new Error('Método no implementado');
  }

  async delete(id) {
    throw new Error('Método no implementado');
  }
}

