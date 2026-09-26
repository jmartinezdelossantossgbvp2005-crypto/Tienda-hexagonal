export class DeleteUser {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(id) {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new Error('Usuario no encontrado');
    }
    return await this.userRepository.delete(id);
  }
}
