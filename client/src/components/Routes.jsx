import { useContext } from "react";
import { userContext } from "../utils/UserContext";
import Register from "./Register";
import Chat from "./Chat";

function Routes() {
  const { username } = useContext(userContext);
  if (username) {
    return <Chat />;
  }
  return <Register />;
}

export default Routes;
