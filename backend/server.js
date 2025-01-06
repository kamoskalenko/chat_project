const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const axios = require("axios");
const User = require("./models/UserSchema");
const Chat = require("./models/ChatSchema");
const { v4: uuidv4 } = require("uuid");

require("dotenv").config();
// const crypto = require("crypto");
// console.log(crypto.randomBytes(32).toString("hex"));
const { JWT_SECRET } = process.env;

// App Initialization
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const { DB_HOST } = process.env;

const initMongoConnection = async () => {
  try {
    await mongoose.connect(DB_HOST);
    console.log("Mongo connection successfully established!");
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};

initMongoConnection();

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, "JWT_SECRET");
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Token is invalid or expired" });
    }

    req.user = user;
    next();
  });
};

app.get("/auth-status", (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ isLoggedIn: false });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ isLoggedIn: true, user: decoded });
  } catch (error) {
    res.status(401).json({ isLoggedIn: false });
  }
});
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .send({ error: "User with this email already exists" });
    }
    const ID = uuidv4();

    const newUser = new User({ name, email, password, username: ID });
    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.status(201).send({ message: "User registered successfully", token });
  } catch (error) {
    res.status(500).send({ error: "Registration failed" });
  }
});

// Routes
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).send({ error: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).send({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.send({ token });
  } catch (error) {
    res.status(500).send({ error: "Login failed" });
  }
});

app.get("/auth-status", authMiddleware, (req, res) => {
  res.json({ isLoggedIn: true, currentUser: req.user });
});

app.get("/chats", authenticateToken, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const chats = await Chat.find({ createdBy: userId });
    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ message: "Error fetching chats" });
  }
});

app.post("/chats", authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, messages } = req.body;

    if (!firstName || !lastName) {
      return res
        .status(400)
        .json({ message: "First name and last name are required." });
    }

    const chat = new Chat({
      firstName,
      lastName,
      messages,
      createdBy: new mongoose.Types.ObjectId(req.user.id),
    });

    await chat.save();
    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ message: "Error creating chat" });
  }
});

app.put("/chats/:id", authenticateToken, async (req, res) => {
  const { firstName, lastName } = req.body;
  const chat = await Chat.findByIdAndUpdate(
    req.params.id,
    { firstName, lastName },
    { new: true }
  );
  res.send(chat);
});

app.delete("/chats/:id", authenticateToken, async (req, res) => {
  await Chat.findByIdAndDelete(req.params.id);
  io.emit("chatDeleted", { chatId: req.params.id });
  res.status(204).send();
});

app.post("/chats/:id/messages", authenticateToken, async (req, res) => {
  const { text } = req.body;
  const chat = await Chat.findById(req.params.id);
  if (!chat) {
    return res.status(404).send({ error: "Chat not found." });
  }
  const userMessage = { text, isAutoResponse: false };
  chat.messages.push(userMessage);
  await chat.save();

  setTimeout(async () => {
    try {
      const response = await axios.get("http://api.quotable.io/random");
      const autoMessage = { text: response.data.content, isAutoResponse: true };
      chat.messages.push(autoMessage);
      await chat.save();

      io.emit("newMessage", { chatId: chat._id, message: autoMessage });
    } catch (error) {
      console.error("Error fetching quote:", error);
    }
  }, 3000);

  res.send(userMessage);
});

io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const { PORT = 5000 } = process.env;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
