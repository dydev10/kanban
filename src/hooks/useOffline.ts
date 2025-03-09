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
  
    const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
    
    // add tasks schema similar to sqlite schema used in backend
    db.createObjectStore('boards', { keyPath: 'id'});
    db.createObjectStore('projects', { keyPath: 'id'});
    db.createObjectStore('columns', { keyPath: 'id'});
    db.createObjectStore('tasks', { keyPath: 'id'});

    // temp
    sessionStore.createIndex('isGuest', 'isGuest', { unique: false });
    sessionStore.createIndex('isOffline', 'isOffline', { unique: false });
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
