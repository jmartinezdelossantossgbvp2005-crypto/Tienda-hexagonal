export class OrderController {
  constructor(createOrderUseCase, getOrdersUseCase, getOrderByIdUseCase, updateOrderStatusUseCase, deleteOrderUseCase) {
    this.createOrderUseCase = createOrderUseCase;
    this.getOrdersUseCase = getOrdersUseCase;
    this.getOrderByIdUseCase = getOrderByIdUseCase;
    this.updateOrderStatusUseCase = updateOrderStatusUseCase;
    this.deleteOrderUseCase = deleteOrderUseCase;
  }

  create = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { items } = req.body;
      const order = await this.createOrderUseCase.execute({ userId, items });
      res.status(201).json({
        success: true,
        message: 'Pedido generado exitosamente',
        data: order
      });
    } catch (error) {
      next(error);
    }
  };

  getAll = async (req, res, next) => {
    try {
      const userId = req.user.role === 'admin' ? null : req.user.id;
      const orders = await this.getOrdersUseCase.execute(userId);
      res.status(200).json({
        success: true,
        data: orders
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const order = await this.getOrderByIdUseCase.execute(req.params.id);
      if (req.user.role !== 'admin' && order.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'No posee autorización para consultar este pedido'
        });
      }
      res.status(200).json({
        success: true,
        data: order
      });
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req, res, next) => {
    try {
      const { status } = req.body;
      const updated = await this.updateOrderStatusUseCase.execute(req.params.id, status);
      res.status(200).json({
        success: true,
        message: 'Estado del pedido actualizado exitosamente',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req, res, next) => {
    try {
      const deleted = await this.deleteOrderUseCase.execute(req.params.id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Pedido no encontrado o no pudo ser eliminado'
        });
      }
      res.status(200).json({
        success: true,
        message: 'Pedido eliminado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  };
}
