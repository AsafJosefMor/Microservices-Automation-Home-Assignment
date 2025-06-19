import { Pool } from 'pg';
import { User } from './User';

export class UserRepo {
    constructor(private pool: Pool) {}

    /**
     * Insert a new user into the database.
     * Returns the created User.
     */
    async create(name: string, email?: string): Promise<User> {
        const { rows } = await this.pool.query<User>(
            `
      INSERT INTO users(name, email)
      VALUES ($1, $2)
      RETURNING id, name, email
      `,
            [name, email ?? null]
        );
        return rows[0];
    }

    /**
     * Fetch a single user by its ID.
     * Returns undefined if not found.
     */
    async findById(id: number): Promise<User | undefined> {
        const { rows } = await this.pool.query<User>(
            `
      SELECT id, name, email
      FROM users
      WHERE id = $1
      `,
            [id]
        );
        return rows[0];
    }
}