/**
 * Auth Service Entry Point
 *
 * This module bootstraps the Express application for the Auth Service,
 * registers middleware and routes, and starts listening on the configured port.
 */

import express, { Request, Response } from 'express';
import authController from './authController';
import { verifyJwt } from './jwt';
// @ts-ignore
import { configAuth } from '../common/config';
// @ts-ignore
import { AuthEndpoints } from '../common/endpoints';

const app = express();

// ────────────────────────────────────────────────────────────────────────────────
// Middleware
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Parse incoming request bodies as JSON.
 * This must come before routes that expect JSON in req.body.
 */
app.use(express.json());

/**
 * Mount the authentication router.
 * All routes (e.g. POST /login) are defined in authController.
 */
app.use(authController);

// ────────────────────────────────────────────────────────────────────────────────
// Routes
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
app.get(AuthEndpoints.HEALTH, (_req: Request, res: Response) => {
    return res.sendStatus(200);
});

/**
* GET /validate
*
* Verifies the Bearer token and returns its payload.
*/
app.get(AuthEndpoints.VALIDATE, (req: Request, res: Response) => {

  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or malformed authorization header' });
      }
  try {
        const token   = header.slice(7);
        const payload = verifyJwt(token);
        return res.status(200).json(payload);
      } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
});

// ────────────────────────────────────────────────────────────────────────────────
// Server Startup
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Start the HTTP server.
 * Uses the port from shared configuration (configAuth.port).
 * Logs a message once the server is ready.
 */
app.listen(configAuth.port, () => {
    console.log(`Auth service listening on port ${configAuth.port}`);
});
