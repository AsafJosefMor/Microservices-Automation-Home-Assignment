/**
 * Gateway Service Entry Point
 *
 * Proxies HTTP requests to Auth, User, and Order services,
 * enforcing JWT authentication where required.
 */

import express, { Request, Response } from 'express';
import axios from 'axios';
// @ts-ignore
import { GatewayEndpoints, UserEndpoints, OrderEndpoints } from '../common/endpoints';
// @ts-ignore
import { serviceUrls, configGateway } from '../common/config';
import {AuthenticatedRequest, authMiddleware} from "./authMiddleware";

const app = express();

// ────────────────────────────────────────────────────────────────────────────────
// Global Middleware
// ────────────────────────────────────────────────────────────────────────────────

// Parse JSON bodies on all requests
app.use(express.json());

/**
 * GET /health
 *
 * Simple health-check endpoint.
 *
 * @param req - Express Requestcat
 * @param res - Express Response
 * @returns   200 OK if service is alive
 */
app.get(GatewayEndpoints.HEALTH, (_req: Request, res: Response) => {
    return res.sendStatus(200);
});

/**
 * POST /login
 *
 * Proxies login requests to the Auth Service.
 * Does NOT require prior authentication.
 *
 * @param req - Express Request with `{ username, password }`
 * @param res - Express Response to relay `{ token }` or error
 */
app.post(GatewayEndpoints.LOGIN, async (req: Request, res: Response) => {
    try {

        // Forward credentials to Auth Service and await its response
        const response = await axios.post(
            `${serviceUrls.authServiceUrl}${GatewayEndpoints.LOGIN}`,
            req.body
        );

        // Relay status and JSON from Auth Service
        return res.status(response.status).json(response.data);

    } catch (err) {
        // If Auth Service returned an error, forward it
        if (axios.isAxiosError(err) && err.response) {
            return res.status(err.response.status).json(err.response.data);
        }
        // Unexpected error
        return res.status(500).json({ error: 'Gateway encountered an error during login.' });
    }
});

/**
 * POST /users
 *
 * Creates a new user via the User Service.
 * Requires a valid Bearer JWT in `Authorization` header.
 *
 * @param req - AuthenticatedRequest with user payload
 * @param res - Express Response to relay created user or error
 */
app.post(
    GatewayEndpoints.USERS,
    authMiddleware,
    async (req: Request, res: Response) => {
        const authReq = req as AuthenticatedRequest;
        try {

            // Forward creation request to User Service
            const response = await axios.post(
                serviceUrls.userServiceUrl + UserEndpoints.CREATE,
                authReq.body,
                { headers: { Authorization: req.headers.authorization! } }
            );

            // Relay status and JSON from User Service
            return res.status(response.status).json(response.data);

        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                return res.status(err.response.status).json(err.response.data);
            }
            return res.status(500).json({ error: 'Gateway error creating user.' });
        }
    }
);


/**
 * GET /users/:userId
 *
 * Proxies to User Service’s GET_BY_ID.
 * Requires a valid Bearer JWT.
 */
app.get(
    GatewayEndpoints.USER_BY_ID,
    authMiddleware,
    async (req, res) => {
        try {
            const url =
                serviceUrls.userServiceUrl +
                UserEndpoints.GET_BY_ID.replace(':userId', req.params.userId);
            const upstream = await axios.get(url, {
                headers: { Authorization: req.headers.authorization! }
            });
            return res.status(upstream.status).json(upstream.data);
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                return res.status(err.response.status).json(err.response.data);
            }
            return res.status(500).json({ error: 'Gateway error fetching user.' });
        }
    }
);

/**
 * POST /orders
 *
 * Creates a new order via the Order Service.
 * Attaches `userId` from the JWT payload to the order object.
 * Requires a valid Bearer JWT.
 *
 * @param req - AuthenticatedRequest with `req.user.id` and order data
 * @param res - Express Response to relay created order or error
 */
app.post(
    GatewayEndpoints.ORDERS,
    authMiddleware,
    async (req: Request, res: Response) => {

        const authReq = req as AuthenticatedRequest;

        try {
            const orderPayload = { ...req.body, userId: authReq.user.id };

            // Forward to Order Service
            const response = await axios.post(
                serviceUrls.orderServiceUrl + OrderEndpoints.CREATE,
                orderPayload,
                { headers: { Authorization: req.headers.authorization! } }
            );

            // Relay status and JSON
            return res.status(response.status).json(response.data);
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                return res.status(err.response.status).json(err.response.data);
            }
            return res.status(500).json({ error: 'Gateway error creating order.' });
        }
    }
);

/**
 * GET /orders
 *
 * Retrieves all orders of the user from the Order Service.
 * Requires a valid Bearer JWT.
 *
 * @param req - AuthenticatedRequest
 * @param res - Express Response to relay orders list or error
 */
app.get(
    GatewayEndpoints.USER_ORDERS,
    authMiddleware,
    async (req: Request, res: Response) => {

        // pull the authenticated user’s ID
        const userId = (req as AuthenticatedRequest).user.id;

        try {
            // build the upstream URL: /orders/user/{userId}
            const url = serviceUrls.orderServiceUrl
                + OrderEndpoints.GET_BY_USER.replace(':userId', String(userId));

            const response = await axios.get(url, {
                headers: { Authorization: req.headers.authorization! }
            });

            return res.status(response.status).json(response.data);

        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                return res.status(err.response.status).json(err.response.data);
            }
            return res.status(500).json({ error: 'Gateway error fetching orders.' });
        }
    }
);

// ────────────────────────────────────────────────────────────────────────────────
// Server Startup
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Start HTTP server on configured port.
 */
app.listen(configGateway.port, () => {
    console.log(`Gateway service listening on port ${configGateway.port}`);
});