import { Request, Response } from 'express';
import { EpicService } from '../services/EpicService.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

export const getAllEpics = asyncHandler(async (req: Request, res: Response) => {
  const epics = await EpicService.getAll();
  res.json(epics);
});

export const createEpic = asyncHandler(async (req: Request, res: Response) => {
  const epic = await EpicService.create(req.body);
  res.status(201).json(epic);
});

export const updateEpic = asyncHandler(async (req: Request, res: Response) => {
  const epic = await EpicService.update(req.params['id'] as string, req.body);
  if (!epic) throw new AppError(404, 'Epic not found');
  res.json(epic);
});

export const deleteEpic = asyncHandler(async (req: Request, res: Response) => {
  const epic = await EpicService.delete(req.params['id'] as string);
  if (!epic) throw new AppError(404, 'Epic not found');
  res.json({ message: 'Epic deleted' });
});
