const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
// directory: imports
const User = require("./models/User.js");
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
    console.log(token);
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
    console.log(err);
    res.status(400).json(err);
  }
});

app.listen(4000, () => {
  connect();
  console.log("Server running on port 4000");
});
