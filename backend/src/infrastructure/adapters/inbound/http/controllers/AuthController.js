export class AuthController {
  constructor(registerUserUseCase, loginUserUseCase, userRepository) {
    this.registerUserUseCase = registerUserUseCase;
    this.loginUserUseCase = loginUserUseCase;
    this.userRepository = userRepository;
  }

  register = async (req, res, next) => {
    try {
      const { name, email, password, role } = req.body;
      const user = await this.registerUserUseCase.execute({ name, email, password, role });
      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const result = await this.loginUserUseCase.execute({ email, password });
      res.status(200).json({
        success: true,
        message: 'Inicio de sesión exitoso',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (req, res, next) => {
    try {
      const user = await this.userRepository.findById(req.user.id);
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
}
