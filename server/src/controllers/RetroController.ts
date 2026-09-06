import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { RETRO_NOTE_CATEGORIES, RetroNoteCategory } from '../models/RetroNote.js';
import { RetroService } from '../services/RetroService.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

const isValidObjectId = (value: string) => mongoose.Types.ObjectId.isValid(value);
const isValidNoteCategory = (value: unknown): value is RetroNoteCategory =>
    typeof value === 'string' && RETRO_NOTE_CATEGORIES.includes(value as RetroNoteCategory);

export const getRetroBootstrap = asyncHandler(async (_req: Request, res: Response) => {
    const data = await RetroService.getRetroBootstrap();
    res.json(data);
});

export const getRetroNotes = asyncHandler(async (req: Request, res: Response) => {
    const sprintId = req.query['sprintId'] as string | undefined;
    if (!sprintId || !isValidObjectId(sprintId)) {
        throw new AppError(400, 'Valid sprintId is required');
    }

    const notes = await RetroService.getNotesBySprint(sprintId);
    res.json(notes);
});

export const createRetroNote = asyncHandler(async (req: Request, res: Response) => {
    const { title, description, category, sprintId } = req.body as {
        title?: string;
        description?: string;
        category?: string;
        sprintId?: string;
    };

    if (!title?.trim() || !description?.trim() || !sprintId || !isValidObjectId(sprintId) || !isValidNoteCategory(category)) {
        throw new AppError(400, 'title, description, valid category, and valid sprintId are required');
    }

    const authorId = req.user?._id?.toString();
    if (!authorId) {
        throw new AppError(401, 'Unauthorized');
    }

    const note = await RetroService.createNote({
        title: title.trim(),
        description: description.trim(),
        category,
        sprintId,
        authorId,
    });

    res.status(201).json(note);
});

export const updateRetroNote = asyncHandler(async (req: Request, res: Response) => {
    const noteId = req.params['id'] as string;
    const { title, description, category, sprintId } = req.body as {
        title?: string;
        description?: string;
        category?: string;
        sprintId?: string;
    };

    if (!isValidObjectId(noteId)) {
        throw new AppError(400, 'Invalid note id');
    }

    if (sprintId && !isValidObjectId(sprintId)) {
        throw new AppError(400, 'Invalid sprintId');
    }

    if (category !== undefined && !isValidNoteCategory(category)) {
        throw new AppError(400, 'Invalid retro note category');
    }

    const note = await RetroService.updateNote(noteId, {
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(description !== undefined ? { description: description.trim() } : {}),
        ...(category !== undefined ? { category: category as RetroNoteCategory } : {}),
        ...(sprintId !== undefined ? { sprintId } : {}),
    });

    if (!note) {
        throw new AppError(404, 'Retro note not found');
    }

    res.json(note);
});

export const deleteRetroNote = asyncHandler(async (req: Request, res: Response) => {
    const noteId = req.params['id'] as string;
    if (!isValidObjectId(noteId)) {
        throw new AppError(400, 'Invalid note id');
    }

    const deleted = await RetroService.deleteNote(noteId);
    if (!deleted) {
        throw new AppError(404, 'Retro note not found');
    }

    res.json({ message: 'Retro note deleted' });
});

export const getRetroActionItems = asyncHandler(async (req: Request, res: Response) => {
    const sprintId = req.query['sprintId'] as string | undefined;
    if (!sprintId || !isValidObjectId(sprintId)) {
        throw new AppError(400, 'Valid sprintId is required');
    }

    const actionItems = await RetroService.getActionItemsBySprint(sprintId);
    res.json(actionItems);
});

export const saveRetroActionItems = asyncHandler(async (req: Request, res: Response) => {
    const sprintId = req.params['sprintId'] as string;
    const { items } = req.body as {
        items?: Array<{ content: string; status?: 'To Do' | 'Done' | 'Ignored' }>;
    };

    if (!isValidObjectId(sprintId)) {
        throw new AppError(400, 'Invalid sprint id');
    }

    if (!items || !Array.isArray(items)) {
        throw new AppError(400, 'items array is required');
    }

    const saved = await RetroService.saveActionItems(sprintId, items);
    res.json(saved);
});

export const getRetroSessionData = asyncHandler(async (req: Request, res: Response) => {
    const sprintId = req.params['sprintId'] as string;
    if (!isValidObjectId(sprintId)) {
        throw new AppError(400, 'Invalid sprint id');
    }

    const data = await RetroService.getSessionData(sprintId);
    res.json(data);
});

export const getRetroStats = asyncHandler(async (req: Request, res: Response) => {
    const sprintId = req.params['sprintId'] as string;
    if (!isValidObjectId(sprintId)) {
        throw new AppError(400, 'Invalid sprint id');
    }

    const stats = await RetroService.getSprintStatistics(sprintId);
    res.json(stats);
});
