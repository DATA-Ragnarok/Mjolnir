export type Status = 'To Do' | 'In Progress' | 'Blocked' | 'Done';

export type UserStoryStatus = 'To Do' | 'In Progress' | 'Blocked' | 'Waiting for MR' | 'Done';

export type Epic = {
  _id: string;
  title: string;
  description?: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
};

export type EpicWithProgress = Epic & {
  totalStoryPoints: number;
  completedStoryPoints: number;
  featureCount: number;
};

export type Feature = {
  _id: string;
  title: string;
  description?: string;
  status: Status;
  epicId: string;
  createdAt: string;
  updatedAt: string;
};

export type FeatureWithProgress = Feature & {
  epicTitle: string;
  userStoryCount: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
};

export type UserStory = {
  _id: string;
  title: string;
  description?: string;
  status: UserStoryStatus;
  storyPoints: number;
  featureId: string;
  sprintId?: string;
  // assignedUser can be a populated User object (from server) or just a user id string (from form/select)
  assignedUser?: User | string;
  createdAt: string;
  updatedAt: string;
};

export type User = {
  _id: string;
  // Provide a stable `id` alias used across components (keep it required to avoid undefined-index issues)
  id?: string;
  googleId: string;
  email: string;
  name: string;
  isApproved: boolean;
  isAdmin: boolean;
};

export type Sprint = {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
};

export type ApiKeyInfo = {
  key: string;
  name: string;
  createdAt: string;
  lastUsedAt?: string;
};
