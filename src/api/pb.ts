import PocketBase from "pocketbase";
import { LoginCredentials } from "../types";

const pb = new PocketBase("https://pb.dydev.art");

export const loginUser = async (creds: LoginCredentials) => {
  return await pb.collection('users').authWithPassword(
    creds.email,
    creds.password,
  );
};

export const getUserId = () => {
  return pb.authStore.record?.id;
};

export const checkSession = () => {
  return pb.authStore.isValid;
};

export default pb;
