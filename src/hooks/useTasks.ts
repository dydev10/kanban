import { useCallback } from "react";
import usePocket from "./usePocket";
import { Board, BoardColumn, Project, Task } from "../types";

export type TaskCreateParams = {
  title: string,
  column: string,
  board: string | null,
  project?: string,
}

export type TaskUpdateParams = {
  id: string,
  updates: Partial<Task>,
}

const useTasks = () => {
  const { pb, user, } = usePocket();

  const getBoards = useCallback(async () => {
      if(user) {
        return await pb.collection("boards").getFullList<Board>();
      }

      // Guest mode
    }, [pb, user]); 
  
  const getProjects = useCallback(async () => {
    if(user) {
      return await pb.collection("projects").getFullList<Project>();
    }
    // Guest mode
  }, [pb, user]);

  const getColumns = useCallback(async (boardId: string | null) => {
    if (!boardId) return [];    
    
    if (user) {
      return await pb.collection("columns").getFullList<BoardColumn>({
        filter: `board = "${boardId}" || board = ""`,
      });
    }
    // Guest mode
  }, [pb, user]);

  const getTasks = useCallback(async (boardId: string | null) => {
    if (!boardId) return [];

    if(user) {
      return await pb.collection("tasks").getFullList<Task>({
        filter: `board = "${boardId}"`,
      });
    }

    // Guest mode
  }, [pb, user]);

  const createTasks = useCallback(async ({ title, column, board, project }: TaskCreateParams) => {
    if (!board) throw new Error(" No board selected");
    
    if (user) {
      const userId = user.id;
      if (!userId) throw new Error("User not authenticated");

      const tempTask: Partial<Task> = {
        title,
        project,
        column,
        board: board,
        user: userId,
      }
      return pb.collection("tasks").create(tempTask);
    }

    // guest mode
  }, [pb, user]);

  const updateTask = useCallback(async ({ id, updates }: TaskUpdateParams) => {
    if (user) {
      return pb.collection("tasks").update(id, updates, { requestKey: null }); // requestKey null to disable auto cancellation
    }

    // guest mode
  }, [pb, user]);

  const deleteTask = useCallback(async (taskId: string) => {
    if (user) {
      return pb.collection("tasks").delete(taskId);
    }

    // guest mode
  }, [pb, user]);

  return {
    getBoards,
    getProjects,
    getColumns,
    getTasks,
    createTasks,
    updateTask,
    deleteTask,
  }
}

export default useTasks;
