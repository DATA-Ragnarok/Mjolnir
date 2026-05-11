import { Request, Response } from 'express';
import { UserService } from '../services/UserService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const getApprovedUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await UserService.getApprovedUsers();
  res.json(users);
});
