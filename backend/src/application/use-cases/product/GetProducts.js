export class GetProducts {
  constructor(productRepository) {
    this.productRepository = productRepository;
  }

  async execute() {
    const products = await this.productRepository.findAll();
    return products.map(product => product.toJSON());
  }
}
