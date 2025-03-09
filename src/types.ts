export type LoginCredentials = {
  email: string,
  password: string,
};

export interface User {
  id: string;
  username?: string;
  email: string;
}

export interface Board {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  title: string;
}

export interface BoardColumn {
  id: string;
  title: string;
  board?: string;
}

export interface Task {
  id: string;
  title: string;
  column: string;
  board: string;
  user: string;
  project?: string;
}

export enum TaskColumns {
  TODO = "todo",
  IN_PROGRESS = "in_progress",
  DONE = "done",
};

/**
 * DB operation payload types
 */
export type PayloadTaskUpdate = {
  id: string,
  updates: Partial<Task>, 
}
