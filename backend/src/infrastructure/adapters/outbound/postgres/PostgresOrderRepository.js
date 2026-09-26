import { OrderRepositoryPort } from '../../../../domain/ports/OrderRepositoryPort.js';
import { Order } from '../../../../domain/entities/Order.js';
import { OrderItem } from '../../../../domain/entities/OrderItem.js';

export class PostgresOrderRepository extends OrderRepositoryPort {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async createWithItems(order, items) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const orderQuery = `
        INSERT INTO orders (user_id, total_amount, status)
        VALUES ($1, $2, $3)
        RETURNING id, user_id, total_amount, status, created_at
      `;
      const orderValues = [order.userId, order.totalAmount, order.status];
      const { rows: orderRows } = await client.query(orderQuery, orderValues);
      const createdOrderRow = orderRows[0];

      const createdItems = [];
      for (const item of items) {
        const itemQuery = `
          INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, order_id, product_id, quantity, unit_price, subtotal
        `;
        const itemValues = [
          createdOrderRow.id,
          item.productId,
          item.quantity,
          item.unitPrice,
          item.getSubtotal()
        ];
        const { rows: itemRows } = await client.query(itemQuery, itemValues);

        const stockUpdateQuery = `
          UPDATE products
          SET stock = stock - $1
          WHERE id = $2 AND stock >= $1
          RETURNING id, name, stock
        `;
        const { rows: stockRows } = await client.query(stockUpdateQuery, [item.quantity, item.productId]);
        if (stockRows.length === 0) {
          throw new Error(`Inventario insuficiente al procesar el producto con ID ${item.productId}`);
        }

        createdItems.push(new OrderItem({
          id: itemRows[0].id,
          orderId: itemRows[0].order_id,
          productId: itemRows[0].product_id,
          productName: item.productName || stockRows[0].name,
          quantity: itemRows[0].quantity,
          unitPrice: itemRows[0].unit_price
        }));
      }

      await client.query('COMMIT');

      return new Order({
        id: createdOrderRow.id,
        userId: createdOrderRow.user_id,
        items: createdItems,
        totalAmount: createdOrderRow.total_amount,
        status: createdOrderRow.status,
        createdAt: createdOrderRow.created_at
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id) {
    const orderQuery = `
      SELECT o.id, o.user_id, o.total_amount, o.status, o.created_at,
             u.name as user_name, u.email as user_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `;
    const { rows: orderRows } = await this.pool.query(orderQuery, [id]);
    if (orderRows.length === 0) return null;

    const itemsQuery = `
      SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, oi.unit_price, oi.subtotal,
             p.name as product_name
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `;
    const { rows: itemRows } = await this.pool.query(itemsQuery, [id]);

    const items = itemRows.map(row => new OrderItem({
      id: row.id,
      orderId: row.order_id,
      productId: row.product_id,
      productName: row.product_name,
      quantity: row.quantity,
      unitPrice: row.unit_price
    }));

    const order = new Order({
      id: orderRows[0].id,
      userId: orderRows[0].user_id,
      items,
      totalAmount: orderRows[0].total_amount,
      status: orderRows[0].status,
      createdAt: orderRows[0].created_at
    });

    order.userName = orderRows[0].user_name;
    order.userEmail = orderRows[0].user_email;
    return order;
  }

  async findByUserId(userId) {
    const orderQuery = `
      SELECT o.id, o.user_id, o.total_amount, o.status, o.created_at
      FROM orders o
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC
    `;
    const { rows: orderRows } = await this.pool.query(orderQuery, [userId]);

    const orders = [];
    for (const row of orderRows) {
      const itemsQuery = `
        SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, oi.unit_price, oi.subtotal,
               p.name as product_name
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = $1
      `;
      const { rows: itemRows } = await this.pool.query(itemsQuery, [row.id]);

      const items = itemRows.map(itemRow => new OrderItem({
        id: itemRow.id,
        orderId: itemRow.order_id,
        productId: itemRow.product_id,
        productName: itemRow.product_name,
        quantity: itemRow.quantity,
        unitPrice: itemRow.unit_price
      }));

      orders.push(new Order({
        id: row.id,
        userId: row.user_id,
        items,
        totalAmount: row.total_amount,
        status: row.status,
        createdAt: row.created_at
      }));
    }
    return orders;
  }

  async findAll() {
    const orderQuery = `
      SELECT o.id, o.user_id, o.total_amount, o.status, o.created_at,
             u.name as user_name, u.email as user_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `;
    const { rows: orderRows } = await this.pool.query(orderQuery);

    const orders = [];
    for (const row of orderRows) {
      const itemsQuery = `
        SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, oi.unit_price, oi.subtotal,
               p.name as product_name
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = $1
      `;
      const { rows: itemRows } = await this.pool.query(itemsQuery, [row.id]);

      const items = itemRows.map(itemRow => new OrderItem({
        id: itemRow.id,
        orderId: itemRow.order_id,
        productId: itemRow.product_id,
        productName: itemRow.product_name,
        quantity: itemRow.quantity,
        unitPrice: itemRow.unit_price
      }));

      const order = new Order({
        id: row.id,
        userId: row.user_id,
        items,
        totalAmount: row.total_amount,
        status: row.status,
        createdAt: row.created_at
      });
      order.userName = row.user_name;
      order.userEmail = row.user_email;
      orders.push(order);
    }
    return orders;
  }

  async updateStatus(id, status) {
    const query = `
      UPDATE orders
      SET status = $1
      WHERE id = $2
      RETURNING id, user_id, total_amount, status, created_at
    `;
    const { rows } = await this.pool.query(query, [status, id]);
    if (rows.length === 0) return null;
    return await this.findById(id);
  }

  async delete(id) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const { rows: orderRows } = await client.query('SELECT status FROM orders WHERE id = $1', [id]);
      if (orderRows.length === 0) {
        await client.query('ROLLBACK');
        return false;
      }
      if (orderRows[0].status === 'pending') {
        const { rows: itemRows } = await client.query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [id]);
        for (const item of itemRows) {
          await client.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [item.quantity, item.product_id]);
        }
      }
      await client.query('DELETE FROM orders WHERE id = $1', [id]);
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

