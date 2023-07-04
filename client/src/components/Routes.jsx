import { useContext } from "react";
import { userContext } from "../utils/UserContext";
import Register from "./Register";

function Routes() {
  const { username } = useContext(userContext);
  if (username) {
    return (
      <div>
        <h1>Welcome {username}</h1>
      </div>
    );
  }
  return <Register />;
}

export default Routes;
