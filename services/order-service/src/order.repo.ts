import { Pool } from 'pg';
import { Order } from './Order';

export class OrderRepo {
    constructor(private pool: Pool) {}

    /**
     * Insert a new order. Returns the created Order.
     */
    async create(userId: number, item: string, quantity: number): Promise<Order> {
        const { rows } = await this.pool.query<any>(
            `
      INSERT INTO orders(user_id, item, quantity)
      VALUES ($1, $2, $3)
      RETURNING id, user_id, item, quantity
      `,
            [userId, item, quantity]
        );
        const raw = rows[0];
        return {
            id:       raw.id,
            userId:   raw.user_id,
            item:     raw.item,
            quantity: raw.quantity
        };
    }

    /**
     * Fetch all orders for a given user.
     */
    async findByUser(userId: number): Promise<Order[]> {
        const { rows } = await this.pool.query<any>(
            `
      SELECT id, user_id, item, quantity
      FROM orders
      WHERE user_id = $1
      `,
            [userId]
        );
        return rows.map(raw => ({
            id:       raw.id,
            userId:   raw.user_id,
            item:     raw.item,
            quantity: raw.quantity
        }));
    }
}