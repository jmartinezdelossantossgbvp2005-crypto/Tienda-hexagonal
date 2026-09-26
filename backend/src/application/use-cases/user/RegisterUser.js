import { User } from '../../../domain/entities/User.js';

export class RegisterUser {
  constructor(userRepository, securityService) {
    this.userRepository = userRepository;
    this.securityService = securityService;
  }

  async execute({ name, email, password, role = 'customer' }) {
    User.validatePasswordComplexity(password);

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('El correo electrónico ya se encuentra registrado');
    }

    const hashedPassword = await this.securityService.hashPassword(password);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role
    });

    const savedUser = await this.userRepository.create(user);
    return savedUser.toJSON();
  }
}
