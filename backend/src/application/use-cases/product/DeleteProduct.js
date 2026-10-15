export class DeleteProduct {
  constructor(productRepository, storageService = null) {
    this.productRepository = productRepository;
    this.storageService = storageService;
  }

  async execute(id) {
    const existing = await this.productRepository.findById(id);
    if (!existing) {
      throw new Error('Producto no encontrado');
    }

    if (existing.imageUrl && this.storageService) {
      try {
        await this.storageService.deleteFile(existing.imageUrl);
      } catch (err) {
        console.warn('Aviso al eliminar archivo en almacenamiento:', err.message);
      }
    }

    return await this.productRepository.delete(id);
  }
}
