import { AuthRecord, RecordAuthResponse } from "pocketbase";
import { createContext } from "react";
import PocketBase from 'pocketbase';
import { User } from "../types";

export interface PocketStore {
  register: (email: string, password: string) => Promise<User>,
  login: (email: string, password: string) => Promise<RecordAuthResponse<User>>,
  logout: () => void,
  user: AuthRecord | null,
  pb: PocketBase,
}

const PocketContext = createContext<PocketStore>({} as PocketStore);

export default PocketContext;
