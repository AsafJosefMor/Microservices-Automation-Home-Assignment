// services/auth-service/src/jwt.ts

import jwt, { Secret, JwtPayload, SignOptions } from 'jsonwebtoken';
// @ts-ignore
import { configAuth } from '../common/config';

/**
 * Sign a payload into a JWT.
 */
export function signJwt(
    payload: { id: number; username: string; role: string },
    expiresIn: SignOptions['expiresIn'] = '1h'
): string {
    return jwt.sign(payload, configAuth.jwtSecret as Secret, { expiresIn });
}

/**
 * Verify and decode a JWT.
 * Returns the payload or throws if invalid/expired.
 */
export function verifyJwt(token: string): JwtPayload {
    return jwt.verify(token, configAuth.jwtSecret as Secret) as JwtPayload;
}