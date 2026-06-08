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

  const token = jwt.sign({ userId: user._id }, config.jwtSecret, { expiresIn: '7d' });

  res.json({ token, user });
});

export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized');
  }
  res.json(req.user);
});
