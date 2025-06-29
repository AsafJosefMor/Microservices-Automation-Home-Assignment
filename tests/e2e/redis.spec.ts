// tests/e2e/redis.spec.ts

import request from 'supertest';
import { createClient } from 'redis';
import { testConfig } from '../utils/config';
import { GatewayEndpoints } from '../../services/common/endpoints';

/**
 * End-to-end test for Orders Redis Pub/Sub integration.
 */
describe('Redis Pub/Sub Integration', () => {
  let token: string;
  let redisUrl: string;

  /**
   * beforeAll: run once before any test.
   * - Logs in via the Gateway to obtain a valid JWT.
   * - Reads the Redis connection URL from testConfig.
   */
  beforeAll(async () => {

    // Get a valid JWT
    const resLogin = await request(testConfig.gatewayUrl)
        .post(GatewayEndpoints.LOGIN)
        .send({ username: 'admin', password: 'password' });
    token = resLogin.body.token;

    // Pull in the Redis URL from env
    redisUrl =testConfig.redisUrl;
  });

  /**
   * Test: publishing of an `order:created` event.
   * -- Connects a Redis subscriber,
   * -- Triggers an order via the Gateway,
   * -- Waits briefly for Pub/Sub delivery,
   * -- Asserts that the expected message arrived.
   */
  it('should publish an order:created event to Redis when creating an order', async () => {
    // Connect subscriber
    const sub = createClient({ url: redisUrl });
    await sub.connect();

    // Collect messages
    const messages: any[] = [];
    await sub.subscribe('order:created', (msg: string) => {
      messages.push(JSON.parse(msg));
    });

    // Trigger the order creation via Gateway
    const orderPayload = { item: 'IntegrationTestBook', quantity: 2 };
    const res = await request(testConfig.gatewayUrl)
        .post(GatewayEndpoints.ORDERS)
        .set('Authorization', `Bearer ${token}`)
        .send(orderPayload);
    expect(res.status).toBe(201);

    // Allow a short window for the Pub/Sub to deliver
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Assert that at least one message arrived with our order
    expect(messages.length).toBeGreaterThanOrEqual(1);
    expect(messages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            item:      orderPayload.item,
            quantity:  orderPayload.quantity,
            userId:    expect.any(Number),
            id:        expect.any(Number)
          })
        ])
    );

    // Clean up
    await sub.unsubscribe('order:created');
    await sub.quit();
  }, 10_000); // give it up to 10s
});