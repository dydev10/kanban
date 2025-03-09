import { useCallback, useEffect, useState } from "react";
import useIDB from "./useIDB";
import { Board, BoardColumn, Project, Task } from "../types";

export type GuestSession = {
  id: string,
  isGuest?: boolean,
  isOffline?: boolean,
};

export const IDBName = 'kanban';

const useOffline = () => {
  const [session, setSession] = useState<GuestSession|null>(null);

  const createDBSchema = useCallback((db: IDBDatabase) => {
    console.log('Creating DB Schema...');
    // Session store for guest session and offline mode
    db.createObjectStore('sessions', { keyPath: 'id' });
    
    // add tasks schema similar to sqlite schema used in backend
    db.createObjectStore('boards', { keyPath: 'id'});
    db.createObjectStore('projects', { keyPath: 'id'});
    db.createObjectStore('columns', { keyPath: 'id'});
    const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
    taskStore.createIndex('user', 'user', { unique: false });
    taskStore.createIndex('board', 'board', { unique: false });
    taskStore.createIndex("board_user", ["board", "user"], { unique: false });
  }, []);
  const { connect, get, getAll, add, del, update } = useIDB(IDBName, createDBSchema);


  const seedOfflineDB = useCallback(async (sessionId: string) => {
    console.log('Seeding db...');
    
    // Add default board
    await add<Board>("boards", { id: 'default_guest_board', name: "Kanban Default" });
    await add<Board>("boards", { id: 'second_guest_board', name: "Second Board" });
    // Add project
    await add<Project>("projects", { id: 'default_guest_project', title: 'Guest Project' });
    // Add columns
    await add<BoardColumn>("columns", { id: 'default_column_0', title: 'todo' });
    await add<BoardColumn>("columns", { id: 'default_column_1', title: 'in_progress' });
    await add<BoardColumn>("columns", { id: 'default_column_2', title: 'done' });

    // Add sample tasks to ez try drag and drop
    await add<Task>("tasks", {
      title: 'Already Finished',
      column: 'default_column_2',
      board: 'default_guest_board',
      user: sessionId,
    });
    await add<Task>("tasks", {
      title: 'Drag Me',
      column: 'default_column_0',
      board: 'default_guest_board',
      user: sessionId,
      project: 'default_guest_project',
    });
    await add<Task>("tasks", {
      title: 'Second B Task',
      column: 'default_column_1',
      board: 'second_guest_board',
      user: sessionId,
      project: 'default_guest_project',
    });

    
    console.log('Seeding Done!');
  }, [add]);

  const setDBSession = useCallback(async (guestSession: GuestSession) => {
    console.log('Creating DB session...', guestSession);
    await add<GuestSession>('sessions', guestSession); 
  }, [add]);

  useEffect(() => {
    async function init() {
      // IndexDB client setup
      const db = await connect();

      if(db) {
        let [currentSession] = await getAll<GuestSession>('sessions');
        if(!currentSession) {
          // First launch of app in this browser
          currentSession = {
            id: crypto.randomUUID(),
            isGuest: true,
            isOffline: false,
          }; 
          try {
            await seedOfflineDB(currentSession.id);
            await setDBSession(currentSession);
          } catch (error) {
            console.error(error)
          } 
        }
        setSession(currentSession);
      }
    }

    // Call async function
    init();
  }, [connect, getAll, setDBSession, seedOfflineDB]);

  return { session, idb: { connect, get, getAll, add, del, update } };
};

export default useOffline;
