import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/UserService.js';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.headers.cookie) {
      const match = req.headers.cookie.split(';').find((c) => c.trim().startsWith('token='));
      if (match) {
        token = match.split('=')[1].trim();
      }
    }

    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    if (!config.jwtSecret) {
      return res.status(500).json({ message: 'Server misconfigured: JWT secret not set' });
    }

    const decoded = jwt.verify(token, config.jwtSecret as string) as unknown as { userId: string };

    const user = await UserService.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.isApproved) {
      return res.status(403).json({ message: 'User not approved' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
