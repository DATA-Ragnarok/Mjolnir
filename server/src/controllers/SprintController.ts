import { Request, Response } from 'express';
import { SprintService } from '../services/SprintService.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

export const getAllSprints = asyncHandler(async (req: Request, res: Response) => {
  const sprints = await SprintService.getAll();
  res.json(sprints);
});

export const createSprint = asyncHandler(async (req: Request, res: Response) => {
  const sprint = await SprintService.create(req.body);
  res.status(201).json(sprint);
});

export const updateSprint = asyncHandler(async (req: Request, res: Response) => {
  const sprint = await SprintService.update(req.params['id'] as string, req.body);
  if (!sprint) throw new AppError(404, 'Sprint not found');
  res.json(sprint);
});

export const deleteSprint = asyncHandler(async (req: Request, res: Response) => {
  const sprint = await SprintService.delete(req.params['id'] as string);
  if (!sprint) throw new AppError(404, 'Sprint not found');
  res.json({ message: 'Sprint deleted' });
});

export const triggerSprintMigration = asyncHandler(async (req: Request, res: Response) => {
  await SprintService.migrateExpiredSprints();
  res.json({ message: 'Sprint migration triggered successfully' });
});
