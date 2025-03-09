import { useCallback } from "react";
import usePocket from "./usePocket";
import { Board, BoardColumn, Project, Task } from "../types";
import useOffline from "./useOffline";

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
  const { session, idb } = useOffline();

  const getBoards = useCallback(async () => {
      if(user) {
        return await pb.collection("boards").getFullList<Board>();
      }
      // Guest mode
      if(session?.isGuest) {
        return await idb.getAll<Board>("boards");
      }
    }, [pb, user, session, idb]); 
  
  const getProjects = useCallback(async () => {
    if(user) {
      return await pb.collection("projects").getFullList<Project>();
    }
    // Guest mode
    if(session?.isGuest) {
      return await idb.getAll<Project>("projects");
    }
  }, [pb, user, session, idb]);

  const getColumns = useCallback(async (boardId: string | null) => {
    if (!boardId) return [];    
    if (user) {
      return await pb.collection("columns").getFullList<BoardColumn>({
        filter: `board = "${boardId}" || board = ""`,
      });
    }
    // Guest mode (temp without filter)
    if (session?.isGuest) {
      return await idb.getAll<BoardColumn>("columns");
    }
  }, [pb, user, session, idb]);


  const getTasks = useCallback(async (boardId: string | null) => {
    if (!boardId) return [];
    if(user) {
      return await pb.collection("tasks").getFullList<Task>({
        filter: `board = "${boardId}"`,
      });
    }
    // Guest mode (temp without filter)
    if(session?.isGuest) {
      return await idb.getAll<Task>("tasks", "board", boardId);
    }
  }, [pb, user, session, idb]);

  const createTasks = useCallback(async ({ title, column, board, project }: TaskCreateParams) => {
    if (!board) throw new Error(" No board selected");
    const newTask = {
      title,
      project,
      column,
      board: board,
    }
    if (user) {
      const userId = user.id;
      if (!userId) throw new Error("User not authenticated");
      const tempTask: Partial<Task> = {
        ...newTask,
        user: userId,
      }
      return pb.collection("tasks").create(tempTask);
    }
    // guest mode
    if (session?.isGuest) {
      const userId = session.id;
      if (!userId) throw new Error("No guest session active");
      const tempTask: Partial<Task> = {
        ...newTask,
        user: userId,
      }
      return idb.add("tasks", tempTask);
    }
  }, [pb, user, session, idb]);

  const updateTask = useCallback(async ({ id, updates }: TaskUpdateParams) => {
    if (user) {
      return pb.collection("tasks").update(id, updates, { requestKey: null }); // requestKey null to disable auto cancellation
    }
    // guest mode
    if (session?.isGuest) {
      return idb.update("tasks", { id, ...updates });
    }
  }, [pb, user, session, idb]);

  const deleteTask = useCallback(async (taskId: string) => {
    if (user) {
      return pb.collection("tasks").delete(taskId);
    }
    // guest mode
    if (session?.isGuest) {
      return idb.del("tasks", taskId);
    }
  }, [pb, user, session, idb]);

  const getGuestId = useCallback(() => {
    return session?.id
  }, [session])

  return {
    getGuestId,
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
