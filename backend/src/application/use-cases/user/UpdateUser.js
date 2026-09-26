import { User } from '../../../domain/entities/User.js';

export class UpdateUser {
  constructor(userRepository, securityService) {
    this.userRepository = userRepository;
    this.securityService = securityService;
  }

  async execute(id, { name, email, password, role }) {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new Error('Usuario no encontrado');
    }

    let hashedPassword = existing.password;
    if (password && password.trim().length > 0) {
      User.validatePasswordComplexity(password);
      hashedPassword = await this.securityService.hashPassword(password);
    }

    const updated = new User({
      id: existing.id,
      name: name || existing.name,
      email: email || existing.email,
      password: hashedPassword,
      role: role || existing.role,
      createdAt: existing.createdAt
    });

    const result = await this.userRepository.update(id, updated);
    return result.toJSON();
  }
}
