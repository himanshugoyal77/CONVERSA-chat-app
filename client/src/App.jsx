
import axios from "axios";
import { UserContextProvider } from "./utils/UserContext";
import Routes from "./components/Routes";

const App = () => {
  axios.defaults.withCredentials = true;
  axios.defaults.baseURL = "http://localhost:4000/api";
  return (
    <UserContextProvider>
      <Routes />
    </UserContextProvider>
  );
};

export default App;
