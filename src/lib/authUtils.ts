
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  email: string;
  name?: string | null;
  role: 'user' | 'admin';
  // iat and exp are standard JWT claims
  iat: number;
  exp: number;
}

/**
 * Extracts and verifies the JWT from the Authorization header of a NextRequest.
 * Returns the decoded payload (including userId) if the token is valid.
 * @param request The NextRequest object.
 * @returns The decoded token payload or null if token is invalid or not present.
 */
export async function getAuthPayloadFromRequest(request: NextRequest): Promise<TokenPayload | null> {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    console.error('[AuthUtils] JWT_SECRET is not defined. Cannot verify token.');
    return null;
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[AuthUtils] No Bearer token found in Authorization header.');
    return null;
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    // Basic check for userId in payload
    if (!decoded.userId) {
        console.warn('[AuthUtils] Token decoded but userId is missing in payload.');
        return null;
    }
    return decoded;
  } catch (error: any) {
    console.warn('[AuthUtils] JWT verification failed:', error.message);
    return null;
  }
}

/**
 * A utility function to get userId from the request's auth token.
 * Returns userId string if successful, null otherwise.
 */
export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
    const payload = await getAuthPayloadFromRequest(request);
    return payload?.userId || null;
}
