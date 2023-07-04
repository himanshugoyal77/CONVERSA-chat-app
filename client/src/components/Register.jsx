import { useContext, useState } from "react";
import axios from "axios";
import { userContext } from "../utils/UserContext";

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { setUsername: setContextUsername, setId } = useContext(userContext);
  const [isLoggedInOrRegister, setIsLoggedInOrRegister] = useState("register");

  const handleRegister = async (e) => {
    e.preventDefault();
    const url = isLoggedInOrRegister === "register" ? "/register" : "/login";
    const res = await axios.post(url, {
      username,
      password,
    });
    const { id } = res.data;
    setContextUsername(username);
    setId(id);
  };
  return (
    <div className="bg-blue-50 h-screen flex items-center">
      <form className="w-64 mx-auto  mb-12">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          type="text"
          placeholder="username"
          className="block w-full rounded-sm mb-2 p-2 border"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="password"
          className="block w-full rounded-sm mb-2 p-2 border"
        />
        <button
          onClick={handleRegister}
          className="bg-blue-500 block w-full text-white rounded-sm p-2"
        >
          {isLoggedInOrRegister === "register" ? "Register" : "Login"}
        </button>
        <div className="text-center mt-2">
          {isLoggedInOrRegister === "register" && (
            <div>
              Aready a member{" "}
              <button
                type="button"
                onClick={() => setIsLoggedInOrRegister("login")}
              >
                Login here
              </button>
            </div>
          )}
          {isLoggedInOrRegister === "login" && (
            <div className="">
              {"Don't"} have an account{" "}
              <button
                type="button"
                onClick={() => setIsLoggedInOrRegister("register")}
              >
                Register
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

export default Register;
