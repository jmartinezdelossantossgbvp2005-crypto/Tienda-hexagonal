export class DeleteProduct {
  constructor(productRepository) {
    this.productRepository = productRepository;
  }

  async execute(id) {
    const existing = await this.productRepository.findById(id);
    if (!existing) {
      throw new Error('Producto no encontrado');
    }
    return await this.productRepository.delete(id);
  }
}
