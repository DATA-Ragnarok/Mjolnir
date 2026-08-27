import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { UserService } from '../services/UserService.js';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

let oauthClient: OAuth2Client;

const getOAuthClient = () => {
  if (!oauthClient) {
    if (!config.googleClientId || config.googleClientId === 'your_google_client_id') {
      console.warn('WARNING: GOOGLE_CLIENT_ID is not set or is using a placeholder.');
    }
    oauthClient = new OAuth2Client(config.googleClientId);
  }
  return oauthClient;
};

export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
  const { idToken } = req.body;

  if (!idToken) {
    throw new AppError(400, 'No idToken provided');
  }

  const client = getOAuthClient();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: config.googleClientId,
  });

  const payload = ticket.getPayload();
  if (!payload) {
    throw new AppError(400, 'Invalid token payload');
  }

  const { sub: googleId, email, name } = payload;
  
  if (!email || !name) {
    throw new AppError(400, 'Missing user information in token');
  }

  let user = await UserService.findByGoogleId(googleId);

  if (!user) {
    const userCount = await UserService.getCount();
    const isFirstUser = userCount === 0;

    user = await UserService.create({
      googleId,
      email,
      name,
      isApproved: isFirstUser,
      isAdmin: isFirstUser,
    });
  }

  const token = jwt.sign({ userId: user._id }, config.jwtSecret as string, { expiresIn: '7d' });

  // Set cookie for auth token and return token + user object
  res.cookie('token', token, {
    httpOnly: false,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });

  res.json({ token, user });
});

export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized');
  }
  res.json(req.user);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  // Clear auth cookie
  res.clearCookie('token', { path: '/' });
  res.json({ ok: true });
});
