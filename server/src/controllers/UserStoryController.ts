import { Request, Response } from 'express';
import { UserStoryService } from '../services/UserStoryService.js';

export const getAllUserStories = async (req: Request, res: Response) => {
  try {
    const filters: any = {};
    if (req.query['featureId']) filters.featureId = req.query['featureId'];
    if (req.query['sprintId']) filters.sprintId = req.query['sprintId'] === 'null' ? null : req.query['sprintId'];
    
    const stories = await UserStoryService.getAll(filters);
    res.json(stories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user stories', error });
  }
};

export const createUserStory = async (req: Request, res: Response) => {
  try {
    const story = await UserStoryService.create(req.body);
    res.status(201).json(story);
  } catch (error) {
    res.status(400).json({ message: 'Error creating user story', error });
  }
};

export const updateUserStory = async (req: Request, res: Response) => {
  try {
    const story = await UserStoryService.update(req.params['id'] as string, req.body);
    if (!story) return res.status(404).json({ message: 'User story not found' });
    res.json(story);
  } catch (error) {
    res.status(400).json({ message: 'Error updating user story', error });
  }
};

export const deleteUserStory = async (req: Request, res: Response) => {
  try {
    const story = await UserStoryService.delete(req.params['id'] as string);
    if (!story) return res.status(404).json({ message: 'User story not found' });
    res.json({ message: 'User story deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user story', error });
  }
};
