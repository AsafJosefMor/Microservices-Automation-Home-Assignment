import request from 'supertest';
import { testConfig } from '../utils/config';
import { GatewayEndpoints } from '../../services/common/endpoints';

describe('Gateway E2E', () => {

  // Will hold the JWT returned by the login step
  let token: string;

  // Will hold the user ID created in the user-creation step
  // (Not used in this demo because the admin user ID is always 1)
  let userId: number;

  // Headers
  const authHeaderString = "Authorization";
  const bearerHeaderString = "Bearer";

  /**
   * Logs in with known credentials against POST /login.
   *
   * - Sends `{ username: 'admin', password: 'password' }`
   * - Expects HTTP 200 and a JSON body containing a `token` string
   * - Stores the token for subsequent authenticated requests
   */
  it('logs in and receives a token', async () => {

    // Send credentials to POST /login and expect a JWT in response
    const res = await request(testConfig.gatewayUrl)
        .post(GatewayEndpoints.LOGIN)
        .send({ username: 'admin', password: 'password' });

    // Assert HTTP 200 OK
    expect(res.status).toBe(200);

    // Store the token for subsequent requests
    token = res.body.token;

    // Ensure the token is a string
    expect(typeof token).toBe('string');
  });

  /**
   * Creates a new user and then retrieves the full user list.
   *
   * - Defines a payload `{ name: 'Alice', email: 'alice@example.com' }`
   * - Calls POST /users with the JWT in the `Authorization` header
   *   • Expects HTTP 201 Created
   *   • Captures the returned `id` for later
   * - Calls GET /users/:userId with the same JWT
   *   • Expects HTTP 200 OK
   *   • Asserts that the previously created user in the response
   */
  it('creates and retrieves a user', async () => {

    // Define a new user payload
    const user = { name: 'Alice', email: 'alice@example.com' };

    // Create the user via POST /users, passing the JWT for authentication
    const resCreate = await request(testConfig.gatewayUrl)
        .post(GatewayEndpoints.USERS)
        .set(authHeaderString, `${bearerHeaderString} ${token}`)

        .send({ name: 'Alice', email: 'alice@example.com' });

    // Assert user creation returns 201 Created
    expect(resCreate.status).toBe(201);

    // Capture the new user's ID
    const userId = resCreate.body.id;
    expect(typeof userId).toBe('number');

    // fetch this user by ID
    const resGet = await request(testConfig.gatewayUrl)
        .get(GatewayEndpoints.USER_BY_ID.replace(':userId', String(userId)))
        .set('Authorization', `Bearer ${token}`);

    // Assert response code
    expect(resGet.status).toBe(200);

    // Assert user object matching the one we created
    expect(resGet.body).toEqual(expect.objectContaining({
      id:    userId,
      name:  user.name,
      email: user.email
    }));
  });

  /**
   * Creates a new order for the authenticated user, then retrieves orders.
   *
   * - Defines a payload `{ item: 'Book', quantity: 1 }`
   * - Calls POST /orders with the JWT:
   *   • Expects HTTP 201 Created
   *   • Verifies the response body includes the correct `userId`
   * - Calls GET /orders with the JWT:
   *   • Expects HTTP 200 OK
   *   • Asserts that the new order appears in the returned list
   */
  it('creates and retrieves orders by user', async () => {
    // Define a new order payload
    const order = { item: 'Book', quantity: 1 };

    // Create the order via POST /orders; the Gateway should attach the userId automatically
    const resCreate = await request(testConfig.gatewayUrl)
        .post(GatewayEndpoints.ORDERS)
        .set(authHeaderString, `${bearerHeaderString} ${token}`)
        .send(order);

    // Assert order creation returns 201 Created
    expect(resCreate.status).toBe(201);

    // Verify the order is stamped with the correct userId
    // We test user ID=1 because the login user is the static Admin user we've created
    // (In a real scenario it should be userId: expect(resCreate.body.userId).toBe(userId))
    const userId = resCreate.body.user_id;
    expect(userId).toBe(1);

    // Fetch all orders via GET /orders/user and ensure our order is in the list
    const resGet = await request(testConfig.gatewayUrl)
          .get(GatewayEndpoints.USER_ORDERS)
      .set(authHeaderString, `${bearerHeaderString} ${token}`);

    // Assert HTTP 200 OK
    expect(resGet.status).toBe(200);

    // Assert the returned array includes our order
    expect(resGet.body).toEqual(
        expect.arrayContaining([expect.objectContaining(order)])
    );
  });
});