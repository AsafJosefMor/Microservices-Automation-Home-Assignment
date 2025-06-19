/**
 * Order Service Entry Point
 *
 * Provides HTTP endpoints to create and retrieve orders,
 * publishes `order:created` events via Redis Pub/Sub,
 * and logs any such events received.
 */

import express, { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { orderSchema } from './orderSchema';
import { OrderRepo } from './order.repo';
// @ts-ignore
import { configOrder, REDIS_CHANNELS } from '../common/config';
// @ts-ignore
import { initRedis, redisClient } from '../common/redisClient';
// @ts-ignore
import { OrderEndpoints } from '../common/endpoints';

const app = express();

// ────────────────────────────────────────────────────────────────────────────────
// Middleware
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Parse incoming JSON payloads so handlers can read `req.body`.
 */
app.use(express.json());

// ────────────────────────────────────────────────────────────────────────────────
// Database Setup
// ────────────────────────────────────────────────────────────────────────────────

/**
 * PostgreSQL connection pool.
 * Uses the shared configuration for the database URL.
 */
const pool = new Pool({ connectionString: configOrder.dbUrl });
const repo = new OrderRepo(pool);

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
app.get(OrderEndpoints.HEALTH, (_req: Request, res: Response) => {
    return res.sendStatus(200);
});

/**
 * Create a new order:
 * - Validates the request body against `orderSchema`.
 * - Inserts into the `orders` table.
 * - Publishes an `order:created` event with the new order payload.
 *
 * Endpoint: POST /orders
 * Request body: { item: string, quantity: number }
 * Response: 201 Created with the saved order object.
 */
app.post(
    OrderEndpoints.CREATE,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Validate incoming data
            const parsed = orderSchema.safeParse(req.body);
            if (!parsed.success) {
                // Return validation errors if the payload is malformed
                return res.status(400).json({ error: parsed.error.errors });
            }
            const { userId, item, quantity } = parsed.data;

            // Insert the new order into Postgres
            const order = await repo.create(userId, item, quantity);

            // Ensure Redis connection is open, then publish the event
            await initRedis();
            await redisClient.publish(
                REDIS_CHANNELS.ORDER_CREATED,
                JSON.stringify(order)
            );

            // Respond with the created order
            return res.status(201).json(order);
        } catch (err) {
            // Forward unexpected errors to the global error handler
            next(err);
        }
    }
);

/**
 * Retrieve all orders by user ID:
 * Endpoint: GET /orders/user/:userId
 * Response: 200 OK with an array of user order objects.
 */
// Retrieve orders for a specific user
app.get(
    OrderEndpoints.GET_BY_USER,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = Number(req.params.userId);

            if (isNaN(id)) {
                return res.status(400).json({ error: 'userId must be a number' });
            }

            // Get the user orders from Postgres
            const orders = await repo.findByUser(id);

            return res.status(200).json(orders);
        } catch (err) {
            next(err);
        }
    }
);

// ────────────────────────────────────────────────────────────────────────────────
// Redis Subscriber
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Set up a Redis subscriber to listen for `order:created` events.
 * Logs each event payload to the console.
 *
 * This IIFE runs once at startup, duplicating the client so
 * it can subscribe independently of the publisher.
 */
(async () => {
    try {
        await initRedis();
        const sub = redisClient.duplicate();
        await sub.connect();
        await sub.subscribe(REDIS_CHANNELS.ORDER_CREATED, (msg: string) => {
            console.log('[Order Service] order:created', msg);
        });
    } catch (err) {
        console.error('[Order Service] Failed to subscribe to Redis:', err);
    }
})();

// ────────────────────────────────────────────────────────────────────────────────
// Server Startup
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Start the HTTP server on the configured port.
 * Logs a startup message once ready.
 */
app.listen(configOrder.port, () => {
    console.log(
        `Order service listening on port ${configOrder.port}`
    );
});