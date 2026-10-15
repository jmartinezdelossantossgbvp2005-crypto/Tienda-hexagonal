import { Product } from '../../../domain/entities/Product.js';

export class UpdateProduct {
  constructor(productRepository, storageService = null) {
    this.productRepository = productRepository;
    this.storageService = storageService;
  }

  async execute(id, { name, description, price, stock, imageFile = null, imageUrl }) {
    const existing = await this.productRepository.findById(id);
    if (!existing) {
      throw new Error('Producto no encontrado');
    }

    let finalImageUrl = imageUrl !== undefined ? imageUrl : existing.imageUrl;

    if (imageFile && this.storageService) {
      const uploadedUrl = await this.storageService.uploadFile(imageFile);
      if (existing.imageUrl && existing.imageUrl !== uploadedUrl) {
        try {
          await this.storageService.deleteFile(existing.imageUrl);
        } catch (err) {
          console.warn('Aviso al eliminar imagen anterior en almacenamiento:', err.message);
        }
      }
      finalImageUrl = uploadedUrl;
    }

    const updated = new Product({
      id: existing.id,
      name: name !== undefined ? name : existing.name,
      description: description !== undefined ? description : existing.description,
      price: price !== undefined ? price : existing.price,
      stock: stock !== undefined ? stock : existing.stock,
      imageUrl: finalImageUrl,
      createdAt: existing.createdAt
    });

    const result = await this.productRepository.update(id, updated);
    return result.toJSON();
  }
}
