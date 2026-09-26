import { UserRepositoryPort } from '../../../../domain/ports/UserRepositoryPort.js';
import { User } from '../../../../domain/entities/User.js';

export class PostgresUserRepository extends UserRepositoryPort {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  mapToEntity(row) {
    if (!row) return null;
    return new User({
      id: row.id,
      name: row.name,
      email: row.email,
      password: row.password,
      role: row.role,
      createdAt: row.created_at
    });
  }

  async create(user) {
    const query = `
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, password, role, created_at
    `;
    const values = [user.name, user.email, user.password, user.role];
    const { rows } = await this.pool.query(query, values);
    return this.mapToEntity(rows[0]);
  }

  async findById(id) {
    const query = `SELECT id, name, email, password, role, created_at FROM users WHERE id = $1`;
    const { rows } = await this.pool.query(query, [id]);
    return this.mapToEntity(rows[0]);
  }

  async findByEmail(email) {
    const query = `SELECT id, name, email, password, role, created_at FROM users WHERE email = $1`;
    const { rows } = await this.pool.query(query, [email]);
    return this.mapToEntity(rows[0]);
  }

  async findAll() {
    const query = `SELECT id, name, email, password, role, created_at FROM users ORDER BY created_at DESC`;
    const { rows } = await this.pool.query(query);
    return rows.map(row => this.mapToEntity(row));
  }

  async update(id, user) {
    const query = `
      UPDATE users
      SET name = $1, email = $2, password = $3, role = $4
      WHERE id = $5
      RETURNING id, name, email, password, role, created_at
    `;
    const values = [user.name, user.email, user.password, user.role, id];
    const { rows } = await this.pool.query(query, values);
    return this.mapToEntity(rows[0]);
  }

  async delete(id) {
    const query = `DELETE FROM users WHERE id = $1`;
    const result = await this.pool.query(query, [id]);
    return result.rowCount > 0;
  }
}
