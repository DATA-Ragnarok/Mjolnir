import { Request, Response } from 'express';
import { SprintService } from '../services/SprintService.js';

export const getAllSprints = async (req: Request, res: Response) => {
  try {
    const sprints = await SprintService.getAll();
    res.json(sprints);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sprints', error });
  }
};

export const createSprint = async (req: Request, res: Response) => {
  try {
    const sprint = await SprintService.create(req.body);
    res.status(201).json(sprint);
  } catch (error) {
    res.status(400).json({ message: 'Error creating sprint', error });
  }
};

export const updateSprint = async (req: Request, res: Response) => {
  try {
    const sprint = await SprintService.update(req.params['id'] as string, req.body);
    if (!sprint) return res.status(404).json({ message: 'Sprint not found' });
    res.json(sprint);
  } catch (error) {
    res.status(400).json({ message: 'Error updating sprint', error });
  }
};

export const deleteSprint = async (req: Request, res: Response) => {
  try {
    const sprint = await SprintService.delete(req.params['id'] as string);
    if (!sprint) return res.status(404).json({ message: 'Sprint not found' });
    res.json({ message: 'Sprint deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting sprint', error });
  }
};

export const triggerSprintMigration = async (req: Request, res: Response) => {
  try {
    await SprintService.migrateExpiredSprints();
    res.json({ message: 'Sprint migration triggered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error triggering sprint migration', error });
  }
};
