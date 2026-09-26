export class LoginUser {
  constructor(userRepository, securityService) {
    this.userRepository = userRepository;
    this.securityService = securityService;
  }

  async execute({ email, password }) {
    if (!email || !password) {
      throw new Error('Debe suministrar correo electrónico y contraseña');
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Credenciales de acceso inválidas');
    }

    const isMatch = await this.securityService.comparePassword(password, user.password);
    if (!isMatch) {
      throw new Error('Credenciales de acceso inválidas');
    }

    const token = this.securityService.generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    return {
      token,
      user: user.toJSON()
    };
  }
}
