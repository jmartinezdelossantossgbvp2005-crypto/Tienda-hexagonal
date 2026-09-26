export class UserController {
  constructor(getUsersUseCase, updateUserUseCase, deleteUserUseCase, userRepository) {
    this.getUsersUseCase = getUsersUseCase;
    this.updateUserUseCase = updateUserUseCase;
    this.deleteUserUseCase = deleteUserUseCase;
    this.userRepository = userRepository;
  }

  getAll = async (req, res, next) => {
    try {
      const users = await this.getUsersUseCase.execute();
      res.status(200).json({
        success: true,
        data: users
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const user = await this.userRepository.findById(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      res.status(200).json({
        success: true,
        data: user.toJSON()
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const updated = await this.updateUserUseCase.execute(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req, res, next) => {
    try {
      const deleted = await this.deleteUserUseCase.execute(req.params.id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado o no pudo ser eliminado'
        });
      }
      res.status(200).json({
        success: true,
        message: 'Usuario eliminado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  };
}
