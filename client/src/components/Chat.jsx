import { useContext, useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import Logo from "./Logo";
import { userContext } from "../utils/UserContext";
import _ from "lodash";
import axios from "axios";

function Chat() {
  const [ws, setWs] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [newMessageText, setNewMessageText] = useState("");
  const { username, id } = useContext(userContext);
  const [messages, setMessages] = useState([]);
  const messagesDivRef = useRef();

  useEffect(() => {
    connectToWs();
  }, []);

  function connectToWs() {
    const ws = new WebSocket("ws://localhost:4000");
    setWs(ws);
    ws.addEventListener("message", handleMessage);
    ws.addEventListener("close", () => {
      setTimeout(() => {
        console.log(
          "trying to reconnect to ws server in 1 second, current state: "
        );
      }, 1000);
      connectToWs();
    });
  }

  function handleMessage(e) {
    const messageData = JSON.parse(e.data);

    if ("online" in messageData) {
      showOnlinePeople(messageData.online);
    } else if ("text" in messageData) {
      setMessages((prev) => [
        ...prev,
        {
          ...messageData,
        },
      ]);
    }
  }

  function showOnlinePeople(peopleArray) {
    const people = {};
    peopleArray.forEach((p) => {
      people[p.userId] = p.username;
    });
    setOnlinePeople(people);
  }

  // const onlinePeopleExOurUser = Object.keys(onlinePeople).filter(
  //   (p) => p !== id
  // );

  const onlinePeopleExOurUser = { ...onlinePeople };
  delete onlinePeopleExOurUser[id];

  function sendMessage(e) {
    e.preventDefault();
    ws.send(
      JSON.stringify({
        recipient: selectedUserId,
        text: newMessageText,
      })
    );
    setNewMessageText("");
    setMessages((prev) => [
      ...prev,
      {
        text: newMessageText,
        sender: id,
        recipient: selectedUserId,
        _id: Date.now(),
      },
    ]);
  }

  useEffect(() => {
    const div = messagesDivRef.current;
    if (!div) return;
    div.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  useEffect(() => {
    if (!selectedUserId) return;
    axios.get("/messages/" + selectedUserId).then((res) => {
      setMessages(res.data);
    });
  }, [selectedUserId]);

  const messagesWithoutDuples = _.uniqBy(messages, "_id");

  return (
    <div className="flex h-screen">
      <div className="bg-white basis-1/3">
        <Logo />
        {
          // traverse an object
          Object.keys(onlinePeopleExOurUser).map((userId) => (
            <div
              onClick={() => setSelectedUserId(userId)}
              key={userId}
              className={
                "border-b   cursor-pointer border-gray-100  flex items-center " +
                (selectedUserId === userId ? "bg-blue-50" : "")
              }
            >
              {selectedUserId === userId && (
                <div className="h-12 w-1 bg-blue-900 rounded-r-md"></div>
              )}
              <div className="flex pl-4 py-2 gap-2 items-center">
                <Avatar userId={userId} username={onlinePeople[userId]} />
                <span className="text-gray-800"> {onlinePeople[userId]}</span>
              </div>
            </div>
          ))
        }
      </div>
      <div className="bg-blue-100 basis-2/3 p-2 flex flex-col h-full w-full">
        <div className="flex-grow">
          {!selectedUserId && (
            <div className="flex h-full justify-center items-center my-auto">
              <p className="text-gray-400">
                &larr; Select a person from the sidebar
              </p>
            </div>
          )}
          {!!selectedUserId && (
            <div className="relative h-full">
              <div className=" absolute overflow-y-scroll inset-0">
                {messagesWithoutDuples.map((m, i) => (
                  <div
                    key={i}
                    className={m.sender === id ? "text-right" : "text-left"}
                  >
                    <div
                      className={
                        "inline-block p-2 my-2 rounded-sm text-sm text-left" +
                        (m.sender === id
                          ? " bg-blue-500 text-white"
                          : " bg-white")
                      }
                    >
                      {messages.sender === id ? "You: " : ""} {m.text}
                    </div>
                  </div>
                ))}
                <div className="" ref={messagesDivRef}></div>
              </div>
            </div>
          )}
        </div>
        {!!selectedUserId && (
          <form className="flex gap-2" onSubmit={sendMessage}>
            <input
              type="text"
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              placeholder="Type your message here"
              className="p-2 bg-white border flex-grow rounded-sm focus:border-blue-900 focus:outline-none"
            />
            <button
              type="submit"
              className="p-2 rounded-sm bg-blue-500 text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Chat;
