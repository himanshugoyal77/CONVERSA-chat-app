const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const ws = require("ws");
// directory: imports
const User = require("./models/User.js");
const Message = require("./models/Message.js");

const connect = require("./connect.js");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());
const bcryptSalt = bcrypt.genSaltSync(10);

app.use(
  cors({
    credentials: true,
    origin: "http://127.0.0.1:5173",
  })
);

async function getUserData(req) {
  return new Promise((resolve, reject) => {
    const token = req.cookies.token;
    if (!token) {
      reject("No token provided");
    }
    jwt.verify(token, process.env.JWT_SECRET, {}, async (err, decoded) => {
      if (err) {
        reject(err);
      }
      resolve(decoded);
    });
  });
}

app.get("/api/profile", (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      res.status(401).json(err);
    }
    res.status(200).json(decoded);
  });
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const foundUser = await User.findOne({ username });
  if (!foundUser) {
    res.status(400).json("User not found");
  }
  const passOk = bcrypt.compareSync(password, foundUser.password);
  if (!passOk) {
    res.status(401).json("Password incorrect");
  }
  jwt.sign(
    {
      userId: foundUser._id,
      username,
    },
    process.env.JWT_SECRET,
    {},
    (err, token) => {
      if (err) {
        res.status(500).json(err);
      }
      res
        .cookie("token", token, {
          sameSite: "none",
          secure: true,
        })
        .status(200)
        .json({
          id: foundUser._id,
        });
    }
  );
});

app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
    const createdUser = await User.create({
      username,
      password: hashedPassword,
    });
    const token = jwt.sign(
      {
        userId: createdUser._id,
        username,
      },
      process.env.JWT_SECRET
    );
    res
      .cookie("token", token, {
        sameSite: "none",
        secure: true,
      })
      .status(201)
      .json({
        id: createdUser._id,
        username,
      });
  } catch (err) {
    res.status(400).json(err);
  }
});

app.get("/api/messages/:userId", async (req, res) => {
  if (!req.params.userId) {
    res.status(400).json("User not found");
    return;
  }

  const userId = req.params.userId;
  const userData = await getUserData(req);
  const messages = await Message.find({
    sender: { $in: [userId, userData.userId] },
    recipient: { $in: [userId, userData.userId] },
  }).sort({ createdAt: 1 });

  res.status(200).json(messages);
});

const server = app.listen(4000, () => {
  connect();
  console.log("Server running on port 4000");
});

// websockets server //

const wss = new ws.Server({ server });
wss.on("connection", (connection, req) => {
  const cookies = req.headers.cookie;
  //find user from cookies
  //read username and userId from cookie of this connection
  if (cookies) {
    const tokenCookieString = cookies
      .split(";")
      .find((str) => str.startsWith("token="));
    if (tokenCookieString) {
      const token = tokenCookieString.split("=")[1];
      if (token) {
        jwt.verify(token, process.env.JWT_SECRET, {}, (err, decoded) => {
          if (err) throw err;
          const { userId, username } = decoded;
          connection.userId = userId;
          connection.username = username;
        });
      }
    }
  }

  connection.on("message", async (message) => {
    const parsedMessage = JSON.parse(message);
    const { recipient, text } = parsedMessage;
    if (recipient && text) {
      const messageDoc = await Message.create({
        sender: connection.userId,
        recipient,
        text,
      });
      [...wss.clients]
        .filter((c) => c.userId === recipient)
        .forEach((c) =>
          c.send(
            JSON.stringify({
              text,
              sender: connection.userId,
              _id: messageDoc._id,
              recipient,
            })
          )
        );
    }
  });

  //send online users to all clients
  [...wss.clients].forEach((client) => {
    client.send(
      JSON.stringify({
        online: [...wss.clients].map((c) => ({
          userId: c.userId,
          username: c.username,
        })),
      })
    );
  });
});
