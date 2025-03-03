export type LoginCredentials = {
  email: string,
  password: string,
};

export interface Board {
  id: string;
  name: string;
}

export interface Task {
  id: string;
  title: string;
  column: string;
  board: string;
  project?: string;
}

export enum TaskColumns {
  TODO = "todo",
  IN_PROGRESS = "in_progress",
  DONE = "done",
};