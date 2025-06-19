/**
 * @module services/common/redisClient
 *
 * Provides a shared Redis client instance and init function
 * for publishing/subscribing across all services.
 */

import { createClient, RedisClientType } from 'redis';
import * as dotenv from 'dotenv';
dotenv.config();  // Load REDIS_HOST/REDIS_PORT from .env

// Default to 'redis' hostname (the Docker Compose service name) and 6379 port
const REDIS_HOST = process.env.REDIS_HOST || 'redis';
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;

/**
 * Singleton Redis client for general purpose (pub/sub publisher by default).
 * Listens for errors and logs them.
 */
export const redisClient: RedisClientType = createClient({
  socket: { host: REDIS_HOST, port: REDIS_PORT },
});

// Explicitly type the error parameter
redisClient.on('error', (err) => {
  // Log any connection or command errors centrally
  console.error('[Redis] Client Error:', err);
});

/**
 * Ensures the Redis client is connected before use.
 *
 * Calling code should always await initRedis() before using redisClient.
 * Subsequent calls are no-ops once the connection is open.
 */
export async function initRedis(): Promise<void> {
  if (!redisClient.isOpen) {
    // connect() will throw if it cannot reach the Redis server
    await redisClient.connect();
    console.log(`[Redis] Connected to ${REDIS_HOST}:${REDIS_PORT}`);
  }
}