import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { SecurityPort } from '../../../../domain/ports/SecurityPort.js';
import { config } from '../../../config/env.js';

export class BcryptJwtAdapter extends SecurityPort {
  constructor() {
    super();
    this.saltRounds = 10;
    this.secret = config.jwt.secret;
    this.expiresIn = config.jwt.expiresIn;
  }

  async hashPassword(plainPassword) {
    return await bcrypt.hash(plainPassword, this.saltRounds);
  }

  async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  generateToken(payload) {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  verifyToken(token) {
    return jwt.verify(token, this.secret);
  }
}
