export class ProductController {
  constructor(createProductUseCase, getProductsUseCase, getProductByIdUseCase, updateProductUseCase, deleteProductUseCase) {
    this.createProductUseCase = createProductUseCase;
    this.getProductsUseCase = getProductsUseCase;
    this.getProductByIdUseCase = getProductByIdUseCase;
    this.updateProductUseCase = updateProductUseCase;
    this.deleteProductUseCase = deleteProductUseCase;
  }

  getAll = async (req, res, next) => {
    try {
      const products = await this.getProductsUseCase.execute();
      res.status(200).json({
        success: true,
        data: products
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const product = await this.getProductByIdUseCase.execute(req.params.id);
      res.status(200).json({
        success: true,
        data: product
      });
    } catch (error) {
      next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const { name, description, price, stock } = req.body;
      const product = await this.createProductUseCase.execute({ name, description, price, stock });
      res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        data: product
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const { name, description, price, stock } = req.body;
      const updated = await this.updateProductUseCase.execute(req.params.id, { name, description, price, stock });
      res.status(200).json({
        success: true,
        message: 'Producto actualizado exitosamente',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req, res, next) => {
    try {
      const deleted = await this.deleteProductUseCase.execute(req.params.id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado o no pudo ser eliminado'
        });
      }
      res.status(200).json({
        success: true,
        message: 'Producto eliminado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  };
}
