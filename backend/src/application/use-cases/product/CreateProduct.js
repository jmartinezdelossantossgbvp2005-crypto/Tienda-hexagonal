import { Product } from '../../../domain/entities/Product.js';

export class CreateProduct {
  constructor(productRepository) {
    this.productRepository = productRepository;
  }

  async execute({ name, description, price, stock }) {
    const product = new Product({
      name,
      description,
      price,
      stock
    });
    const saved = await this.productRepository.create(product);
    return saved.toJSON();
  }
}
