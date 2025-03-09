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
import usePageLifecycle from "../hooks/usePageLifecycle";

const BASE_URL = process.env.PB_URL;
const fiveMinutesInMs = ms("5 minutes");
const twoMinutesInMs = ms("2 minutes");

export const PocketProvider: FC<PropsWithChildren> = ({ children }) => {
  const { getPageState } = usePageLifecycle(() => {
    handlePageStateChange();
  });
  const pb = useMemo(() => new PocketBase(BASE_URL), []);

  const [user, setUser] = useState<AuthRecord|null>(pb.authStore.record);
  const [authError, setAuthError] = useState<string|null>(null);

  const checkExpiredToken = useCallback((token: string, onExpired: () => void, bufferMs?: number, ) => {
    const decoded = jwtDecode(token);
    const tokenExpiration = decoded.exp; // Already in seconds
    const currentTime = Date.now() / 1000; // Convert current time to seconds
    let checkTime = currentTime;
    if (bufferMs) {
      const bufferTime = bufferMs / 1000; // Convert buffer to seconds
      checkTime += bufferTime
    }

    if (tokenExpiration && tokenExpiration < checkTime) {
      onExpired();
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    return await pb
      .collection<User>("users")
      .create({ email, password, passwordConfirm: password });
  }, [pb]);

  const login = useCallback(async (email: string, password: string) => {
    setAuthError(null);
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

  const verifyToken = useCallback(async () => {
    return pb.collection("users").authRefresh();
  }, [pb]);

  const handlePageStateChange = useCallback(() => {
    const newState = getPageState();
    if (newState === 'active' && user && !pb.authStore.isValid) {
      logout();
    }
  }, [pb, user, logout, getPageState,]);

  const refreshSession = useCallback(async () => {
    const token = pb.authStore.token;
    if (!token || !pb.authStore.isValid) return;

    checkExpiredToken(token, () => {
      console.log("Refreshing access...");
      verifyToken()
        .then(() => {
          console.log("Token Refresh Done.");
        })
        .catch((err: Error) => {
          console.error('Session refresh failed, forcing logout...', err);
          logout();
        });
    }, fiveMinutesInMs);
    
  }, [pb, checkExpiredToken, verifyToken, logout]);

  // useInterval(refreshSession, token ? twoMinutesInMs : null);
  useInterval(refreshSession, pb.authStore.token ? twoMinutesInMs : null);
  
  useEffect(() => { 
    // verify token on mount
    if (pb.authStore.token) {
      checkExpiredToken(pb.authStore.token, () => {
        logout();
      });
    }
    
    pb.authStore.onChange((_token, model) => {
      setUser(model);
      setAuthError(null);
    });
  }, [pb, checkExpiredToken, logout]);

  return (
    <PocketContext.Provider
      value={{ register, login, logout, user, pb, authError }}
    >
      {children}
    </PocketContext.Provider>
  );
};

export default PocketProvider;
