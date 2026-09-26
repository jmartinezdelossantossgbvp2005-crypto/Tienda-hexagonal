import { ProductRepositoryPort } from '../../../../domain/ports/ProductRepositoryPort.js';
import { Product } from '../../../../domain/entities/Product.js';

export class PostgresProductRepository extends ProductRepositoryPort {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  mapToEntity(row) {
    if (!row) return null;
    return new Product({
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      stock: row.stock,
      createdAt: row.created_at
    });
  }

  async create(product) {
    const query = `
      INSERT INTO products (name, description, price, stock)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, description, price, stock, created_at
    `;
    const values = [product.name, product.description, product.price, product.stock];
    const { rows } = await this.pool.query(query, values);
    return this.mapToEntity(rows[0]);
  }

  async findById(id, client = null) {
    const db = client || this.pool;
    const query = `SELECT id, name, description, price, stock, created_at FROM products WHERE id = $1`;
    const { rows } = await db.query(query, [id]);
    return this.mapToEntity(rows[0]);
  }

  async findAll() {
    const query = `SELECT id, name, description, price, stock, created_at FROM products ORDER BY created_at DESC`;
    const { rows } = await this.pool.query(query);
    return rows.map(row => this.mapToEntity(row));
  }

  async update(id, product) {
    const query = `
      UPDATE products
      SET name = $1, description = $2, price = $3, stock = $4
      WHERE id = $5
      RETURNING id, name, description, price, stock, created_at
    `;
    const values = [product.name, product.description, product.price, product.stock, id];
    const { rows } = await this.pool.query(query, values);
    return this.mapToEntity(rows[0]);
  }

  async delete(id) {
    const query = `DELETE FROM products WHERE id = $1`;
    const result = await this.pool.query(query, [id]);
    return result.rowCount > 0;
  }

  async updateStock(id, newStock, client = null) {
    const db = client || this.pool;
    const query = `UPDATE products SET stock = $1 WHERE id = $2 RETURNING id, name, description, price, stock, created_at`;
    const { rows } = await db.query(query, [newStock, id]);
    return this.mapToEntity(rows[0]);
  }
}
