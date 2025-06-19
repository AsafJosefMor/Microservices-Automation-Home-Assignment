/**
 * User Service Entry Point
 *
 * Provides HTTP endpoints to create and retrieve users,
 * publishes `user:created` events via Redis Pub/Sub,
 * and logs any such events received.
 */

import express, { Request, Response, NextFunction } from 'express';
import { userSchema } from './userSchema';
import { Pool } from 'pg';
import { UserRepo } from './user.repo';
// @ts-ignore
import { initRedis, redisClient } from '../common/redisClient';
// @ts-ignore
import { configUser, REDIS_CHANNELS } from '../common/config';
// @ts-ignore
import { UserEndpoints } from '../common/endpoints';

const app = express();

// ────────────────────────────────────────────────────────────────────────────────
// Middleware
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Parse incoming JSON payloads so handlers can access req.body.
 */
app.use(express.json());

// ────────────────────────────────────────────────────────────────────────────────
// Database Setup
// ────────────────────────────────────────────────────────────────────────────────

/**
 * PostgresSQL connection pool:
 * Uses the shared database URL from common config.
 */
const pool = new Pool({ connectionString: configUser.dbUrl });
const repo = new UserRepo(pool);

// ────────────────────────────────────────────────────────────────────────────────
// Route Handlers
// ────────────────────────────────────────────────────────────────────────────────

/**
 * GET /health
 *
 * Simple health-check endpoint.
 *
 * @param req - Express Request
 * @param res - Express Response
 * @returns   200 OK if service is alive
 */
app.get(UserEndpoints.HEALTH, (_req: Request, res: Response) => {
    return res.sendStatus(200);
});

/**
 * Create a new user:
 * - Validates request body against Zod schema (`userSchema`).
 * - Inserts into `users` table and returns the created record.
 * - Publishes a `user:created` event to Redis.
 *
 * Endpoint: POST /users
 * Body: { name: string, email?: string }
 * Response: 201 Created with the saved user object.
 */
app.post(
    UserEndpoints.CREATE,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Validate input data
        const parsed = userSchema.safeParse(req.body);

        if (!parsed.success) {
          // Return 400 if validation fails
          return res.status(400).json({ error: parsed.error.errors });
        }
        const { name, email } = parsed.data;

        // Insert new user into Postgres
        const user = await repo.create(name, email);

        // Ensure Redis is connected, then publish the event
        await initRedis();
        await redisClient.publish(
            REDIS_CHANNELS.USER_CREATED,
            JSON.stringify(user)
        );

        // Respond with the created user
        return res.status(201).json(user);
      } catch (err) {
        // Forward any unexpected errors to Express error handler
        next(err);
      }
    }
);

/**
 * GET /users/:userId
 *
 * Return the user matching the given ID, or 404 if not found.
 */
app.get(
    UserEndpoints.GET_BY_ID,
    async (req: Request, res: Response) => {

        const id = Number(req.params.userId);

        // Get the user from Postgres
        const user = await repo.findById(id);

        if (!user) {
              return res.status(404).json({ error: `User ${id} not found` });
        }
        return res.json(user);
    }
);

// ────────────────────────────────────────────────────────────────────────────────
// Redis Subscriber
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Immediately-invoked async function to set up
 * a Redis subscriber for `user:created` events.
 * Logs each event payload to the console.
 */
(async () => {
  try {
    await initRedis();
    const sub = redisClient.duplicate();
    await sub.connect();
    await sub.subscribe(REDIS_CHANNELS.USER_CREATED, (msg: string) => {
      console.log('[User Service] user:created', msg);
    });
  } catch (err) {
    console.error('[User Service] Redis subscription failed:', err);
  }
})();

// ────────────────────────────────────────────────────────────────────────────────
// Server Startup
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Start the HTTP server on the configured port.
 * Logs a startup message once the server is listening.
 */
app.listen(configUser.port, () => {
  console.log(`User service listening on port ${configUser.port}`);
});