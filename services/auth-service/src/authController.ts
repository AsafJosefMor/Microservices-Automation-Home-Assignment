/**
 * Auth Controller
 *
 * Defines the `/login` endpoint for user authentication.
 * Validates incoming credentials and issues a JWT on success.
 */

import { Router, Request, Response } from 'express';
import { loginSchema } from './authSchemas';
import { signJwt } from './jwt';

const router = Router();

/**
 * In-memory demo user for authentication.
 * Replace this with a real DB lookup in production.
 */
const demoUser = {
    /** Unique identifier for demo login -
     * must be equals do the one generated in the DB */
    id: 1,
    /** Username for demo login */
    username: 'admin',
    /** Password for demo login */
    password: 'password',
    /** Role to embed in JWT */
    role: 'user',
};

/**
 * Handles POST /login requests.
 *
 * 1. Validates the request body against Zod schema.
 * 2. Compares credentials to in-memory user.
 * 3. Issues a JWT with `{ id, username, role }` on success.
 * 4. Returns 400 on validation error or 401 on auth failure.
 *
 * @param req  - Express Request containing `{ username, password }`.
 * @param res  - Express Response to send `{ token }` or error JSON.
 * @returns     A JSON response with a signed JWT or an error.
 */
function loginHandler(req: Request, res: Response) {
    // Validate incoming payload
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
        // Return 400 Bad Request with validation details
        return res.status(400).json({
            error: 'Invalid request payload',
            details: result.error.format(),
        });
    }

    // Destructure validated fields
    const { username, password } = result.data;

    // Check credentials against demoUser
    if (username === demoUser.username && password === demoUser.password) {
        // Sign JWT including `id` so Gateway can authorize
        const token = signJwt({
            id: demoUser.id,
            username,
            role: demoUser.role,
        });
        // Return the JWT
        return res.json({ token });
    }

    // Credentials invalid: respond with 401 Unauthorized
    return res.status(401).json({ error: 'Invalid credentials' });
}

// Register the login handler on the router
router.post('/login', loginHandler);

// Export the router to be mounted in the service entry point
export default router;