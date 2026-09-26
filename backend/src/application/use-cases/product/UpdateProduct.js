import { Product } from '../../../domain/entities/Product.js';

export class UpdateProduct {
  constructor(productRepository) {
    this.productRepository = productRepository;
  }

  async execute(id, { name, description, price, stock }) {
    const existing = await this.productRepository.findById(id);
    if (!existing) {
      throw new Error('Producto no encontrado');
    }

    const updated = new Product({
      id: existing.id,
      name: name !== undefined ? name : existing.name,
      description: description !== undefined ? description : existing.description,
      price: price !== undefined ? price : existing.price,
      stock: stock !== undefined ? stock : existing.stock,
      createdAt: existing.createdAt
    });

    const result = await this.productRepository.update(id, updated);
    return result.toJSON();
  }
}
