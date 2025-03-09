import { useCallback, useEffect, useState } from "react";
import useIDB from "./useIDB";

export type GuestSession = {
  id: string,
  isGuest?: boolean,
  isOffline?: boolean,
};

export const IDBName = 'kanban';

const useOffline = () => {
  const { connect, get, getAll, add, del, update } = useIDB(IDBName);
  const [session, setSession] = useState<GuestSession|null>(null);

  const createDBSchema = (db: IDBDatabase) => {
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
    taskStore.createIndex('project', 'project', { unique: false });
    taskStore.createIndex('column', 'column', { unique: false });
  };

  const setDBSession = useCallback(async (guestSession: GuestSession) => {
    console.log('Creating DB session...', guestSession);
    await add<GuestSession>('sessions', guestSession); 
  }, [add]);

  useEffect(() => {
    async function init() {
      // IndexDB client setup
      const { db, upgrade } = await connect();

      // First launch of app in this browser
      if (upgrade) {
        createDBSchema(db);
      }
      
      if(db) {
        let [currentSession] = await getAll<GuestSession>('sessions');
        if(!currentSession) {
          currentSession = {
            id: crypto.randomUUID(),
            isGuest: true,
            isOffline: false,
          };  
          await setDBSession(currentSession);
        }
        setSession(currentSession);
      } 
    }

    // Call async function
    init();
  }, [connect, setDBSession, getAll]);

  return { session, idb: { connect, get, getAll, add, del, update } };
};

export default useOffline;
