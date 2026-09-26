export class ProductRepositoryPort {
  async create(product) {
    throw new Error('Método no implementado');
  }

  async findById(id) {
    throw new Error('Método no implementado');
  }

  async findAll() {
    throw new Error('Método no implementado');
  }

  async update(id, productData) {
    throw new Error('Método no implementado');
  }

  async delete(id) {
    throw new Error('Método no implementado');
  }

  async updateStock(id, newStock, client = null) {
    throw new Error('Método no implementado');
  }
}
