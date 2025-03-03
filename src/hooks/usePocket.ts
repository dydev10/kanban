import { useContext } from "react";
import PocketContext from "../contexts/PocketContext";

const usePocket = () => useContext(PocketContext);

export default usePocket;
