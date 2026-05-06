import { Request, Response } from 'express';
import { EpicService } from '../services/EpicService.js';

export const getAllEpics = async (req: Request, res: Response) => {
  try {
    const epics = await EpicService.getAll();
    res.json(epics);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching epics', error });
  }
};

export const createEpic = async (req: Request, res: Response) => {
  try {
    const epic = await EpicService.create(req.body);
    res.status(201).json(epic);
  } catch (error) {
    res.status(400).json({ message: 'Error creating epic', error });
  }
};

export const updateEpic = async (req: Request, res: Response) => {
  try {
    const epic = await EpicService.update(req.params['id'] as string, req.body);
    if (!epic) return res.status(404).json({ message: 'Epic not found' });
    res.json(epic);
  } catch (error) {
    res.status(400).json({ message: 'Error updating epic', error });
  }
};

export const deleteEpic = async (req: Request, res: Response) => {
  try {
    const epic = await EpicService.delete(req.params['id'] as string);
    if (!epic) return res.status(404).json({ message: 'Epic not found' });
    res.json({ message: 'Epic deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting epic', error });
  }
};
