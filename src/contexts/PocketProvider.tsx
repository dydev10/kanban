import {
  useState,
  useEffect,
  useMemo,
  PropsWithChildren,
  FC,
  useCallback,
} from "react";
import PocketBase, { AuthRecord } from 'pocketbase';
import { jwtDecode } from "jwt-decode";
import { useInterval } from "usehooks-ts";
import ms from "ms";
import PocketContext from "./PocketContext";
import { User } from "../types";

const BASE_URL = process.env.PB_URL;
const fiveMinutesInMs = ms("5 minutes");
const twoMinutesInMs = ms("2 minutes");

export const PocketProvider: FC<PropsWithChildren> = ({ children }) => {
  const pb = useMemo(() => new PocketBase(BASE_URL), []);

  const [user, setUser] = useState<AuthRecord|null>(pb.authStore.record);
  const [authError, setAuthError] = useState<string|null>(null);

  useEffect(() => {    
    return pb.authStore.onChange((_token, model) => {
      setUser(model);
      setAuthError(null);
    });
  }, [pb]);

  const register = useCallback(async (email: string, password: string) => {
    return await pb
      .collection<User>("users")
      .create({ email, password, passwordConfirm: password });
  }, [pb]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      await pb.collection<User>("users").authWithPassword(email, password);
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
        setAuthError(error.message);
      }
    }
    return;
  }, [pb]);

  const logout = useCallback(() => {
    pb.authStore.clear();
  }, [pb]);


  const refreshSession = useCallback(async () => {
    const token = pb.authStore.token;
    if (!token || !pb.authStore.isValid) return;
    
    const decoded = jwtDecode(token);
    const tokenExpiration = decoded.exp; // Already in seconds
    const currentTime = Date.now() / 1000; // Convert current time to seconds
    const bufferTime = fiveMinutesInMs / 1000; // Convert buffer to seconds

    if (tokenExpiration && tokenExpiration < currentTime + bufferTime) {
      console.log("Refreshing access...");
      await pb.collection("users").authRefresh();
    }
  }, [pb]);

  // useInterval(refreshSession, token ? twoMinutesInMs : null);
  useInterval(refreshSession, pb.authStore.token ? twoMinutesInMs : null);
  
  return (
    <PocketContext.Provider
      value={{ register, login, logout, user, pb, authError }}
    >
      {children}
    </PocketContext.Provider>
  );
};

export default PocketProvider;
