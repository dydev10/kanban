import { useCallback, useRef } from "react";

const useIDB = (idbName: string, onUpgrade: (idb: IDBDatabase) => void) => {
  const db = useRef<IDBDatabase>(null);
  const connect = useCallback(() => {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const idbOpenRequest = window.indexedDB.open(idbName);
      let upgrade = false;
      idbOpenRequest.onerror = (e) => {
        console.trace(e);
        reject(e);
      };
  
      idbOpenRequest.onsuccess = () => {
        // check if upgrade event is already triggered, because it already resolved this promise
        if (!upgrade) {
          db.current = idbOpenRequest.result;
          resolve(idbOpenRequest.result);
        }
      };
  
      idbOpenRequest.onupgradeneeded = (event) => {
        console.log('DB upgrade needed', event);
        upgrade = true;
        db.current = idbOpenRequest.result;
        onUpgrade(db.current);
      };
    });
  }, [idbName, onUpgrade]);

  const get = useCallback(<T>(collectionName: string, id: string): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      if (!db.current) return reject();

      const transaction = db.current.transaction([collectionName]);
      const objectStore = transaction.objectStore(collectionName);
      const request = objectStore.get(id);

      // listen to listen instead of transaction to get get from request result
      request.onsuccess = () => {
        return resolve(request.result);
      };
      request.onerror = (event) => {
        console.trace(event);
        return reject();
      };
    });
  }, []);

  const getAll = useCallback(<T>(collectionName: string, index?: string, indexId?: string): Promise<T[]> => {
    return new Promise<T[]>((resolve, reject) => {
      if (!db.current) return reject();

      const transaction = db.current.transaction([collectionName]);
      const objectStore = transaction.objectStore(collectionName);
      const request = index ? objectStore.index(index).getAll(indexId) : objectStore.getAll();

      // listen to request instead of transaction to get data from request result
      request.onsuccess = () => {
        return resolve(request.result);
      };
      request.onerror = (event) => {
        console.trace(event);
        return reject();
      };
    });
  }, []);

  const add = useCallback(<T extends { id?: string }>(collectionName: string, data: Partial<T>): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      if (!db.current) return reject();

      const transaction = db.current.transaction([collectionName], 'readwrite');
      transaction
        .objectStore(collectionName)
        .add({
          id: data.id || crypto.randomUUID(),
          ...data,
        });

      transaction.oncomplete = () => {
        return resolve();
      };
      transaction.onerror = (event) => {
        console.trace(event);
        return reject(event);
      };
    });
  }, []);

  const del = useCallback((collectionName: string, id: string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      if (!db.current) return reject();

      const transaction = db.current.transaction([collectionName], 'readwrite');
      transaction
        .objectStore(collectionName)
        .delete(id);

      transaction.oncomplete = () => {
        return resolve();
      };
      transaction.onerror = (event) => {
        console.trace(event);
        return reject();
      };
    });
  }, []);
  
  const update = useCallback(<T extends { id: string }>(collectionName: string, data: Partial<T>): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      if (!db.current || !data.id) return reject();

      const transaction = db.current.transaction([collectionName], 'readwrite');
      const objectStore = transaction.objectStore(collectionName);
      const requestGet = objectStore.get(data.id);

      // listen to request instead of transaction to get data from request result
      requestGet.onerror = (event) => {
        // Handle errors!
        console.trace(event);
        return reject();
      };
      requestGet.onsuccess = () => {
        if (requestGet.result) {
          const doc = requestGet.result;
          const newDoc = {
            ...doc,
            ...data,
          }
          // Put this updated object back into the database.
          const requestUpdate = objectStore.put(newDoc);
          requestUpdate.onerror = (event) => {
            console.trace(event);
          };
          requestUpdate.onsuccess = () => {
            return resolve();
          };
        } else {
          console.error('Id did not match for any document to update');
          transaction.abort();
          return reject();
        }
      };
    });
  }, []);

  

  return {
    connect,
    get,
    getAll,
    add,
    del,
    update,
  }
};

export default useIDB;
