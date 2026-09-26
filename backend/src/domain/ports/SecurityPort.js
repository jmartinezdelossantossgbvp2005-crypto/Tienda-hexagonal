export class SecurityPort {
  async hashPassword(plainPassword) {
    throw new Error('Método no implementado');
  }

  async comparePassword(plainPassword, hashedPassword) {
    throw new Error('Método no implementado');
  }

  generateToken(payload) {
    throw new Error('Método no implementado');
  }

  verifyToken(token) {
    throw new Error('Método no implementado');
  }
}
