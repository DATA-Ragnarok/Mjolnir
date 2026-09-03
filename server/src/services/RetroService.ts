import { SprintDAL } from '../dal/SprintDAL.js';
import { UserStoryDAL } from '../dal/UserStoryDAL.js';
import { RetroNoteDAL } from '../dal/RetroNoteDAL.js';
import { RetroActionItemDAL } from '../dal/RetroActionItemDAL.js';
import { UserStory, UserStoryStatusHistoryEntry } from '../models/UserStory.js';
import { RetroActionItemStatus } from '../models/RetroActionItem.js';
import { AppError } from '../middleware/errorHandler.js';

type SprintStats = {
  cycleTimeHours: number;
  throughput: number;
  blockedAging: Array<{
    storyId: string;
    title: string;
    blockedHours: number;
  }>;
};

type ActionItemInput = {
  content: string;
  status?: RetroActionItemStatus;
};

export class RetroService {
  static async getRetroBootstrap() {
    const sprints = await SprintDAL.findAll();
    const currentSprint = await this.findCurrentSprint();

    return {
      sprints,
      currentSprintId: currentSprint ? currentSprint._id.toString() : null,
    };
  }

  static async getNotesBySprint(sprintId: string) {
    return await RetroNoteDAL.findBySprintId(sprintId);
  }

  static async createNote(data: { title: string; description: string; sprintId: string; authorId: string }) {
    return await RetroNoteDAL.create(data);
  }

  static async updateNote(id: string, data: { title?: string; description?: string; sprintId?: string }) {
    return await RetroNoteDAL.update(id, data);
  }

  static async deleteNote(id: string) {
    return await RetroNoteDAL.delete(id);
  }

  static async getActionItemsBySprint(sprintId: string) {
    const items = await RetroActionItemDAL.findBySprintId(sprintId);
    const slots = ['', '', ''];
    const statuses: RetroActionItemStatus[] = ['To Do', 'To Do', 'To Do'];

    for (const item of items) {
      if (item.slot >= 0 && item.slot <= 2) {
        slots[item.slot] = item.content;
        statuses[item.slot] = item.status;
      }
    }

    return {
      sprintId,
      slots,
      statuses,
      items,
    };
  }

  static async saveActionItems(sprintId: string, items: ActionItemInput[]) {
    if (items.length !== 3) {
      throw new AppError(400, 'Exactly 3 action item slots are required');
    }

    const normalized = items.map((item, index) => ({
      content: item.content.trim(),
      status: item.status ?? 'To Do',
      sprintId,
      slot: index,
    }));

    const filledCount = normalized.filter((item) => item.content.length > 0).length;
    if (filledCount < 2) {
      throw new AppError(400, 'At least 2 action item slots must be filled');
    }

    return await RetroActionItemDAL.replaceSprintItems(normalized);
  }

  static async getSessionData(sprintId: string) {
    const sprint = await SprintDAL.findById(sprintId);
    if (!sprint) {
      throw new AppError(404, 'Sprint not found');
    }

    const previousSprint = await SprintDAL.findOne(
      { startDate: { $lt: sprint.startDate } },
      { startDate: -1 },
    );

    const previousActionItems = previousSprint
      ? await RetroActionItemDAL.findBySprintId(previousSprint._id.toString())
      : [];
    const currentActionItems = await RetroActionItemDAL.findBySprintId(sprintId);

    const notes = await RetroNoteDAL.findBySprintId(sprintId);
    const stats = await this.getSprintStatistics(sprintId);

    return {
      sprint,
      previousSprint,
      previousActionItems,
      currentActionItems,
      notes,
      stats,
    };
  }

  static async getSprintStatistics(sprintId: string): Promise<SprintStats> {
    const sprint = await SprintDAL.findById(sprintId);
    if (!sprint) {
      throw new AppError(404, 'Sprint not found');
    }

    const sprintStart = sprint.startDate;
    const sprintEnd = sprint.endDate;

    const stories = await UserStoryDAL.find({ sprintId });

    const cycleTimesMs: number[] = [];
    let throughput = 0;
    const blockedAgingRows: Array<{ storyId: string; title: string; blockedHours: number }> = [];

    for (const story of stories as UserStory[]) {
      const history = this.getSortedStatusHistory(story);

      const doneEvent = history.find(
        (entry) => entry.status === 'Done' && entry.changedAt >= sprintStart && entry.changedAt <= sprintEnd,
      );

      if (doneEvent) {
        throughput += 1;
        const inProgressBeforeDone = [...history]
          .reverse()
          .find((entry) => entry.status === 'In Progress' && entry.changedAt <= doneEvent.changedAt);

        if (inProgressBeforeDone && doneEvent.changedAt > inProgressBeforeDone.changedAt) {
          cycleTimesMs.push(doneEvent.changedAt.getTime() - inProgressBeforeDone.changedAt.getTime());
        }
      }

      const blockedDurationMs = this.getBlockedDurationWithinWindow(history, sprintStart, sprintEnd);
      if (blockedDurationMs > 0) {
        blockedAgingRows.push({
          storyId: story._id.toString(),
          title: story.title,
          blockedHours: Number((blockedDurationMs / (1000 * 60 * 60)).toFixed(2)),
        });
      }
    }

    blockedAgingRows.sort((a, b) => b.blockedHours - a.blockedHours);

    const avgCycleTimeMs = cycleTimesMs.length
      ? cycleTimesMs.reduce((sum, value) => sum + value, 0) / cycleTimesMs.length
      : 0;

    return {
      cycleTimeHours: Number((avgCycleTimeMs / (1000 * 60 * 60)).toFixed(2)),
      throughput,
      blockedAging: blockedAgingRows,
    };
  }

  private static async findCurrentSprint() {
    const now = new Date();
    const active = await SprintDAL.findOne(
      { startDate: { $lte: now }, endDate: { $gte: now } },
      { startDate: -1 },
    );
    if (active) {
      return active;
    }

    return await SprintDAL.findOne({}, { startDate: -1 });
  }

  private static getSortedStatusHistory(story: UserStory) {
    const history = [...(story.statusHistory ?? [])].sort(
      (a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime(),
    );

    if (history.length === 0) {
      history.push({
        status: story.status,
        changedAt: story.createdAt,
      });
    }

    return history.map((entry) => ({
      status: entry.status,
      changedAt: new Date(entry.changedAt),
    }));
  }

  private static getBlockedDurationWithinWindow(history: UserStoryStatusHistoryEntry[], windowStart: Date, windowEnd: Date) {
    let totalMs = 0;

    for (let index = 0; index < history.length; index += 1) {
      const current = history[index];
      const next = history[index + 1];

      if (current.status !== 'Blocked' && current.status !== 'Waiting for MR') {
        continue;
      }

      const segmentStart = current.changedAt;
      const segmentEnd = next ? next.changedAt : new Date();

      const overlapStart = segmentStart > windowStart ? segmentStart : windowStart;
      const overlapEnd = segmentEnd < windowEnd ? segmentEnd : windowEnd;

      if (overlapEnd > overlapStart) {
        totalMs += overlapEnd.getTime() - overlapStart.getTime();
      }
    }

    return totalMs;
  }
}
