import { RecordAuthResponse, RecordModel } from "pocketbase";
import { createContext } from "react";
import PocketBase from 'pocketbase';

export interface PocketStore {
  register: (email: string, password: string) => Promise<RecordModel>,
  login: (email: string, password: string) => Promise<RecordAuthResponse<RecordModel>>,
  logout: () => void,
  user: RecordModel | null,
  token: string | null,
  pb: PocketBase,
}

const PocketContext = createContext<PocketStore>({} as PocketStore);

export default PocketContext;
