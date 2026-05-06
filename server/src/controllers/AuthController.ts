import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { UserService } from '../services/UserService.js';
import jwt from 'jsonwebtoken';

const client = new OAuth2Client(process.env['GOOGLE_CLIENT_ID']);

export const googleAuth = async (req: Request, res: Response) => {
  const { idToken } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env['GOOGLE_CLIENT_ID'],
    });

    const payload = ticket.getPayload();
    if (!payload) return res.status(400).json({ message: 'Invalid token' });

    const { sub: googleId, email, name } = payload;

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

    const token = jwt.sign({ userId: user._id }, process.env['JWT_SECRET'] || 'secret', { expiresIn: '7d' });

    res.json({ token, user });
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed', error });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  res.json((req as any).user);
};
