import { Request, RequestHandler } from 'express';
import axios from 'axios';
// @ts-ignore
import { serviceUrls } from '../common/config';

/**
 * Represents a request that has been authenticated via JWT.
 * @interface
 * @extends Request
 * @property {{ id: number; username: string; role: string }} user - Decoded JWT payload.
 */
export interface AuthenticatedRequest extends Request {
  user: { id: number; username: string; role: string };
}

/**
 * Auth middleware: forwards the Bearer token to Auth Service /validate.
 */
export const authMiddleware: RequestHandler = async (req, res, next) => {

  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed authorization header' });
  }

  try {
    const response = await axios.get(
        `${serviceUrls.authServiceUrl}/validate`,
        { headers: { Authorization: header } }
    );
    (req as any).user = response.data;
    next();

  } catch (err) {
    // if Auth Service rejects, forward 401; otherwise 500
    const status = axios.isAxiosError(err) && err.response?.status === 401 ? 401 : 500;
    return res.status(status).json({ error: 'Unauthorized' });
  }
};