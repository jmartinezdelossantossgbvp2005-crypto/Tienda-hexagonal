export class GetUsers {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute() {
    const users = await this.userRepository.findAll();
    return users.map(user => user.toJSON());
  }
}
