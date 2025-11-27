import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export interface JwtPayload {
    id: string;
    email: string;
    role: string;
}

export function signJwt(payload: JwtPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);
}

export function verifyJwt(token: string): JwtPayload | null {
    try {
        return jwt.verify(token, config.jwt.secret) as JwtPayload;
    } catch (error) {
        return null;
    }
}
