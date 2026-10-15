import { Product } from '../../../domain/entities/Product.js';

export class CreateProduct {
  constructor(productRepository, storageService = null) {
    this.productRepository = productRepository;
    this.storageService = storageService;
  }

  async execute({ name, description, price, stock, imageFile = null, imageUrl = null }) {
    let finalImageUrl = imageUrl;

    if (imageFile && this.storageService) {
      finalImageUrl = await this.storageService.uploadFile(imageFile);
    }

    const product = new Product({
      name,
      description,
      price,
      stock,
      imageUrl: finalImageUrl
    });
    const saved = await this.productRepository.create(product);
    return saved.toJSON();
  }
}
