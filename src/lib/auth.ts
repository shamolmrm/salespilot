import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export interface JwtPayload extends JWTPayload {
  userId: string;
  role: string;
}

export async function signAccessToken(payload: { userId: string; role: string }): Promise<string> {
  return new SignJWT({ userId: payload.userId, role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(secret);
}

export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, secret);
  return payload as JwtPayload;
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
