import crypto from 'crypto';

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

    // Generar un ID de sesión único para garantizar una sola sesión activa
    const sessionId = crypto.randomUUID();
    if (typeof this.userRepository.updateSessionId === 'function') {
      await this.userRepository.updateSessionId(user.id, sessionId);
    }
    user.activeSessionId = sessionId;

    const token = this.securityService.generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      sessionId
    });

    return {
      token,
      sessionId,
      user: user.toJSON()
    };
  }
}
