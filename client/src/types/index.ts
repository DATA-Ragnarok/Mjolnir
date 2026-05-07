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

export type Feature = {
  _id: string;
  title: string;
  description?: string;
  status: Status;
  epicId: string;
  createdAt: string;
  updatedAt: string;
};

export type UserStory = {
  _id: string;
  title: string;
  description?: string;
  status: UserStoryStatus;
  storyPoints: number;
  featureId: string;
  sprintId?: string;
  assignedUserId?: string;
  createdAt: string;
  updatedAt: string;
};

export type User = {
  _id: string;
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
