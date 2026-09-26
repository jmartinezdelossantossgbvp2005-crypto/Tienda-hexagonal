export class User {
  constructor({ id = null, name, email, password, role = 'customer', createdAt = new Date() }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.password = password;
    this.role = role;
    this.createdAt = createdAt;
    this.validate();
  }

  validate() {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('El nombre de usuario es obligatorio');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.email || !emailRegex.test(this.email)) {
      throw new Error('El formato de correo electrónico es inválido');
    }
    if (this.role !== 'admin' && this.role !== 'customer') {
      throw new Error('El rol asignado no es válido');
    }
  }

  static validatePasswordComplexity(plainPassword) {
    if (!plainPassword || plainPassword.trim().length < 3) {
      throw new Error('La contraseña debe tener al menos 3 caracteres');
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      role: this.role,
      createdAt: this.createdAt
    };
  }
}
